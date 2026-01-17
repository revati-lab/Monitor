# Fabricator Inventory Management POC

A Next.js proof-of-concept application for fabricators to track inventory by uploading packing list images/PDFs, extracting data, and querying inventory with natural language searches using Google Gemini AI.

## Features

- **File Upload**: Upload images (JPEG, PNG) and PDFs of packing lists
- **Mock OCR**: Simulates data extraction from uploaded files (generates sample inventory data)
- **AI-Powered Search**: Natural language query interface using Google Gemini via Vercel AI SDK
- **Inventory Management**: View and browse all inventory items
- **Database**: PostgreSQL with Drizzle ORM

## Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Database**: PostgreSQL with Drizzle ORM + Drizzle Studio
- **AI**: Google Gemini via Vercel AI SDK (`@ai-sdk/google`)
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Copy the example environment file and update with your values:
   ```bash
   cp .env.example .env.local
   ```
   
   Then edit `.env.local` with your actual values:
   - `DATABASE_URL`: Your PostgreSQL connection string
     - Format: `postgresql://username:password@host:port/database_name`
   - `GOOGLE_GENERATIVE_AI_API_KEY`: Your Google Generative AI API key
     - Get your API key from: https://aistudio.google.com/app/apikey

3. **Set up the database**:
   ```bash
   # Generate migrations
   npm run db:generate

   # Run migrations
   npm run db:migrate

   # Open Drizzle Studio (optional)
   npm run db:studio
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
Monitor/
├── app/
│   ├── api/
│   │   ├── upload/          # File upload endpoint
│   │   ├── process-upload/  # Process uploads with mock OCR
│   │   ├── chat/            # AI chat endpoint (Gemini)
│   │   ├── stats/           # Inventory statistics
│   ├── upload/              # Upload page
│   ├── search/              # AI search interface
│   ├── inventory/           # Inventory list view
│   └── page.tsx             # Dashboard
├── components/
│   ├── FileUpload.tsx       # File upload component
│   ├── InventoryTable.tsx   # Table display component
│   └── ChatInterface.tsx    # AI chat interface
├── lib/
│   ├── db.ts                # Drizzle database instance
│   ├── mockOCR.ts           # Mock OCR service
│   ├── queryHelpers.ts      # Database query helpers
│   └── ai.ts                # AI utilities
├── drizzle/
│   ├── schema.ts            # Database schema
│   └── migrations/          # Database migrations
└── types/
    └── inventory.ts         # TypeScript types
```

## Usage

1. **Upload Files**: Navigate to the Upload page and upload packing list images or PDFs
2. **Process Uploads**: After uploading, click "Process & Save to Database" to extract and store data
3. **Search Inventory**: Use the Search page to ask natural language questions like:
   - "Show me stock from vendor ABC"
   - "Items with invoice INV-123456"
   - "Show me all steel beams"
   - "Items with quantity more than 50"
4. **View Inventory**: Browse all inventory items on the Inventory page

## Notes

- The OCR service is currently mocked and generates sample data. For production, integrate a real OCR service (OpenAI Vision, Google Vision API, Tesseract, etc.)
- This is a POC - focus is on demonstrating the workflow and AI query capabilities
- Database migrations are handled via Drizzle Kit
- Drizzle Studio can be used for database visualization and management
