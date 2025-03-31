// Import required modules
import dotenv from 'dotenv'; // Load environment variables from .env
import express, { Request, Response } from 'express'; // Express server and types
import OpenAI from 'openai'; // Official OpenAI SDK

// Load .env configuration
dotenv.config();

// Initialize Express app
const app = express();
app.use(express.json());

// Set port and initialize OpenAI client
const port = process.env.PORT || 3001;
const aiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!, // Use the API key from environment variables
});

// =============================
// POST /forecast
// Description: Accepts a city name and returns a 5-day weather forecast
//              in the style of a sports announcer using OpenAI's API.
// =============================
app.post('/forecast', async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Extract and validate the 'location' from the request body
    const location: string = req.body.location;

    if (!location) {
      res.status(400).json({
        error: 'Please provide a location in the request body.',
      });
      return;
    }

    // 2. Build the OpenAI prompt with strict JSON response instructions
    const prompt = `
      Give a five-day weather forecast for ${location} in the style of a sports announcer.
      Respond ONLY in this strict JSON format:

      {
        "day1": "Exciting Day 1 forecast here...",
        "day2": "Day 2 keeps the action going...",
        "day3": "Midweek heat or chill on Day 3...",
        "day4": "Approaching the weekend with Day 4...",
        "day5": "Final day of the week showdown..."
      }
    `;

    // 3. Call OpenAI's GPT-4 model with the prompt
    const completion = await aiClient.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "user", content: prompt }
      ],
      temperature: 0.8,
    });

    // 4. Get the response content from the model
    const messageContent = completion.choices[0]?.message?.content;

    if (!messageContent) {
      res.status(500).json({ error: 'No response from OpenAI.' });
      return;
    }

    // 5. Try parsing the model's output as JSON
    let forecast;
    try {
      forecast = JSON.parse(messageContent);
    } catch (parseError) {
      console.error('JSON Parsing Error:', parseError);
      res.status(500).json({ error: 'Failed to parse forecast data.' });
      return;
    }

    // 6. Send the structured forecast result back to the client
    res.status(200).json({ result: forecast });

  } catch (error: unknown) {
    // 7. General error handling
    if (error instanceof Error) {
      console.error('Error:', error.message);
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
