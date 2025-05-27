import { Preferences } from '@capacitor/preferences';
import { config } from '../config';

// Always get the latest backend URL
const getApiUrl = () => `${config.BACKEND_URL}/api/generate-quiz`;

export const aiService = {
  async generateQuiz(content) {
    if (!content || typeof content !== 'string') {
      throw new Error('Invalid content provided for quiz generation');
    }

    try {
      console.log('Sending request to backend proxy...');
      
      // Add retry mechanism for model loading
      let retries = 3;
      let lastError = null;
      let waitTime = 90000; // Start with 40 seconds for cold start
      
      while (retries > 0) {
        try {
          const response = await fetch(getApiUrl(), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content })
          });

          // Log response details for debugging
          console.log('Response status:', response.status);
          console.log('Response headers:', Object.fromEntries(response.headers.entries()));

          if (!response.ok) {
            const errorData = await response.json();
            console.error('API error response:', errorData);
            throw new Error(`API error: ${response.status} ${response.statusText} - ${errorData.error}`);
          }

          const data = await response.json();
          console.log('API response:', data);
          
          if (!data?.[0]?.generated_text) {
            throw new Error('Invalid response format from API');
          }

          const quizContent = data[0].generated_text;
          console.log('Quiz content:', quizContent);
          
          // Parse the generated text into structured questions
          const questions = this.parseGeneratedQuiz(quizContent);
          
          if (!Array.isArray(questions) || questions.length === 0) {
            throw new Error('No valid questions generated');
          }
          
          // Add unique IDs to each question
          return questions.map(q => ({
            ...q,
            id: crypto.randomUUID()
          }));
        } catch (error) {
          lastError = error;
          console.error(`Attempt failed (${retries} retries left):`, error);
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, waitTime));
            waitTime *= 2; // Exponential backoff
          }
        }
      }

      throw lastError || new Error('Failed to generate quiz after multiple attempts');
    } catch (error) {
      console.error('Error generating quiz:', error);
      throw new Error(error.message || 'Failed to generate quiz. Please try again.');
    }
  },

  parseGeneratedQuiz(text) {
    try {
      const questions = [];
      const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
      let i = 0;
      while (i < lines.length) {
        const line = lines[i];
        // Flexible Multiple Choice
        if (/^multiple choice:?$/i.test(line)) {
          // Find the next Q: line
          let qIdx = i + 1;
          while (qIdx < lines.length && !/^q:/i.test(lines[qIdx])) qIdx++;
          const qLine = lines[qIdx] || '';
          // Skip any 'A:' line after Q:
          let optStart = qIdx + 1;
          if (/^a:/i.test(lines[optStart])) optStart++; // If the first option is 'A:', skip it
          while (optStart < lines.length && /^a:/i.test(lines[optStart])) optStart++; // skip all 'A:' lines
          // If the next line is 'A:' (the answer, not an option), skip it
          if (/^a:/i.test(lines[optStart])) optStart++;
          // Actually, let's just skip a single 'A:' line if present
          if (lines[optStart] && /^a:/i.test(lines[optStart])) optStart++;
          // But in your LM output, the answer line is 'A: ...', so skip it if present
          if (lines[optStart] && /^A: /.test(lines[optStart])) optStart++;
          // Now collect options (a-d or A-D)
          const options = [];
          let optIdx = optStart;
          while (
            optIdx < lines.length &&
            /^[a-dA-D]\)/.test(lines[optIdx])
          ) {
            const optLine = lines[optIdx];
            options.push({
              id: optLine[0].toLowerCase(),
              text: optLine.substring(2).trim()
            });
            optIdx++;
          }
          // Find the correct answer line
          let correctLine = '';
          while (optIdx < lines.length && !/^correct:/i.test(lines[optIdx])) optIdx++;
          if (optIdx < lines.length) correctLine = lines[optIdx];
          if (
            qLine &&
            options.length === 4 && // Only accept if all 4 options are present
            /^correct:/i.test(correctLine)
          ) {
            const correctId = correctLine.substring(8).trim().toLowerCase();
            // Only accept if correctId matches one of the option ids
            if (options.some(opt => opt.id === correctId)) {
              questions.push({
                type: 'multiple_choice',
                question: qLine.substring(2).trim(),
                options,
                correctAnswer: correctId
              });
            }
            i = optIdx + 1;
            continue;
          }
        }
        // Robust Fill in the Blank (with or without section header)
        if (/^fill in the blank:?$/i.test(line) || line.toLowerCase().startsWith('fill:')) {
          let fillIdx = /^fill in the blank:?$/i.test(line) ? i + 1 : i;
          // If this line is 'Fill: ...', use it directly, else look for the next 'Fill:' or line with underscores
          let fillLine = lines[fillIdx] || '';
          if (!fillLine.toLowerCase().startsWith('fill:') && !/_{2,}/.test(fillLine)) {
            while (fillIdx < lines.length && !/_{2,}|^fill:/i.test(lines[fillIdx])) fillIdx++;
            fillLine = lines[fillIdx] || '';
          }
          let answerIdx = fillIdx + 1;
          while (answerIdx < lines.length && !/^(correct:|answer:)/i.test(lines[answerIdx])) answerIdx++;
          const answerLine = lines[answerIdx] || '';
          if (
            fillLine &&
            (fillLine.toLowerCase().startsWith('fill:') || /_{2,}/.test(fillLine)) &&
            answerLine &&
            /^(correct:|answer:)/i.test(answerLine)
          ) {
            let questionText = fillLine.toLowerCase().startsWith('fill:') 
              ? fillLine.substring(5).trim() 
              : fillLine.trim();
            questionText = questionText.replace(/(_\s*){2,}/g, '_____');
            let answer = answerLine.replace(/^(correct:|answer:)/i, '').trim();
            const words = answer.split(/\s+/);
            if (words.length > 2) {
              answer = words.slice(0, 2).join(' ');
            }
            if (questionText.includes('_____') && answer) {
              questions.push({
                type: 'fill_blank',
                question: questionText,
                answer: answer
              });
            }
            i = answerIdx + 1;
            continue;
          }
        }
        // Robust True or False
        if (/^true or false:?$/i.test(line)) {
          let tofIdx = i + 1;
          while (tofIdx < lines.length && !/^true or false:/i.test(lines[tofIdx])) tofIdx++;
          const tofLine = lines[tofIdx] || '';
          // Check for [True] or [False] answer format
          let bracketAnswerIdx = tofIdx + 1;
          if (bracketAnswerIdx < lines.length && /^\[(true|false)\]$/i.test(lines[bracketAnswerIdx])) {
            const correctAnswer = lines[bracketAnswerIdx].replace(/\[|\]/g, '').trim().toLowerCase();
            questions.push({
              type: 'true_false',
              question: tofLine.substring(15).trim(),
              options: ['True', 'False'],
              correctAnswer: correctAnswer === 'true' ? 'true' : 'false'
            });
            i = bracketAnswerIdx + 1;
            continue;
          }
          // Find a) True and b) False
          let aIdx = tofIdx + 1;
          while (aIdx < lines.length && !/^a\)\s*true/i.test(lines[aIdx])) aIdx++;
          const aLine = lines[aIdx] || '';
          let bIdx = aIdx + 1;
          while (bIdx < lines.length && !/^b\)\s*false/i.test(lines[bIdx])) bIdx++;
          const bLine = lines[bIdx] || '';
          // Find correct
          let correctIdx = bIdx + 1;
          while (correctIdx < lines.length && !/^(correct:|answer:)/i.test(lines[correctIdx])) correctIdx++;
          const correctLine = lines[correctIdx] || '';
          if (
            tofLine.toLowerCase().startsWith('true or false:') &&
            /^a\)\s*true/i.test(aLine) &&
            /^b\)\s*false/i.test(bLine) &&
            /^(correct:|answer:)/i.test(correctLine)
          ) {
            let rawAnswer = correctLine.replace(/^(correct:|answer:)/i, '').trim().toLowerCase();
            let correctAnswer = 'false'; // default fallback
            if (rawAnswer === 'a' || rawAnswer === 'true') correctAnswer = 'true';
            else if (rawAnswer === 'b' || rawAnswer === 'false') correctAnswer = 'false';
            else {
              console.warn('parseGeneratedQuiz: Could not determine correct answer for true/false question:', tofLine, 'rawAnswer:', rawAnswer);
            }
            questions.push({
              type: 'true_false',
              question: tofLine.substring(15).trim(),
              options: ['True', 'False'],
              correctAnswer
            });
            i = correctIdx + 1;
            continue;
          }
        }
        // Skip any other type
        i++;
      }
      return questions;
    } catch (error) {
      console.error('Error parsing generated quiz:', error);
      throw new Error('Failed to parse generated quiz content');
    }
  },

  determineQuestionType(lines) {
    const text = lines.join('\n').toLowerCase();
    if (text.includes('multiple choice')) return 'multiple_choice';
    if (text.includes('fill')) return 'fill_blank';
    if (text.includes('identification')) return 'identification';
    if (text.includes('enumeration')) return 'enumeration';
    return 'multiple_choice'; // Default type
  }
}; 