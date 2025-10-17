const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://hrbchptvypjsyzthwlni.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyYmNocHR2eXBqc3l6dGh3bG5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0Mzk5MTQsImV4cCI6MjA3MzAxNTkxNH0.sAdWdb_83TosehhZsLMampno4kX5CmVPVbVMdgAVEFg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeFix() {
  try {
    const sqlContent = fs.readFileSync('./FIX_FOREIGN_KEY_FINAL.sql', 'utf8');

    // Executar o SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });

    if (error) {
      console.error('Erro ao executar SQL:', error);
    } else {
      console.log('SQL executado com sucesso:', data);
    }
  } catch (error) {
    console.error('Erro:', error);
  }
}

executeFix();