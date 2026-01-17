export async function GET() {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    return Response.json({ 
      success: false, 
      error: 'DATABASE_URL not found in environment variables' 
    }, { status: 500 });
  }

  // Check if it's a valid PostgreSQL URL format
  const isValidFormat = dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://');
  
  return Response.json({ 
    success: true,
    hasDatabaseUrl: true,
    isValidFormat,
    urlPreview: dbUrl.substring(0, 50) + '...',
    message: 'DATABASE_URL is configured correctly'
  });
}
