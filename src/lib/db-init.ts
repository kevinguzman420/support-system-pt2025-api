// lib/db-init.ts
import { existsSync, copyFileSync, mkdirSync } from 'fs';
import { join } from 'path';

export function initializeDatabase() {
  // Solo en producción (Vercel)
  if (process.env.VERCEL) {
    const dbPath = '/tmp/dev.db';
    
    // Si la base de datos no existe en /tmp, copiarla
    if (!existsSync(dbPath)) {
      const sourceDb = join(process.cwd(), 'prisma', 'dev.db');
      
      console.log('📦 Copiando base de datos a /tmp para escritura...');
      
      try {
        // Asegurar que el directorio /tmp existe
        mkdirSync('/tmp', { recursive: true });
        
        // Copiar la base de datos
        copyFileSync(sourceDb, dbPath);
        
        console.log('✅ Base de datos copiada exitosamente a /tmp');
      } catch (error) {
        console.error('❌ Error copiando base de datos:', error);
      }
    }
  }
}
