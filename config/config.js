require('dotenv').config();

const config = {
  jina: {
    apiKey: process.env.JINA_API_KEY,
    searchUrl: 'https://s.jina.ai/',
    readerUrl: 'https://r.jina.ai/',
  },
  
  supabase: {
    url: process.env.NODE_ENV === 'development' 
      ? process.env.SUPABASE_LOCAL_URL 
      : process.env.SUPABASE_URL,
    anonKey: process.env.NODE_ENV === 'development'
      ? process.env.SUPABASE_LOCAL_ANON_KEY
      : process.env.SUPABASE_ANON_KEY,
    dbPassword: process.env.SUPABASE_DB_PASSWORD,
  },

  app: {
    port: parseInt(process.env.PORT) || 3000,
    env: process.env.NODE_ENV || 'development',
  },
};

module.exports = config;