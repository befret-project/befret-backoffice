#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Mapping des couleurs bleues vers vertes
const colorMappings = {
  // Couleurs de base
  'blue-50': 'green-50',
  'blue-100': 'green-100',
  'blue-200': 'green-200',
  'blue-300': 'green-300',
  'blue-400': 'green-400',
  'blue-500': 'green-500',
  'blue-600': 'green-600',
  'blue-700': 'green-700',
  'blue-800': 'green-800',
  'blue-900': 'green-900',
  
  // Couleurs spécifiques pour les variantes claires
  'bg-blue-50': 'bg-green-50',
  'bg-blue-100': 'bg-green-100',
  'text-blue-600': 'text-green-600',
  'text-blue-700': 'text-green-700',
  'text-blue-800': 'text-green-800',
  'text-blue-900': 'text-green-900',
  'border-blue-200': 'border-green-200',
  'border-blue-300': 'border-green-300',
  'hover:bg-blue-50': 'hover:bg-green-50',
  'hover:text-blue-600': 'hover:text-green-600',
  
  // Couleurs pour les graphiques (remplacer par couleurs BeFret)
  "'#3b82f6'": "'#1a7125'", // blue-500 -> BeFret green dark
  '"#3b82f6"': '"#1a7125"',
  '#3b82f6': '#1a7125',
  
  // Couleurs primaires spécifiques
  'text-blue-600': 'text-green-600',
  'bg-blue-600': 'bg-green-600',
  'border-blue-600': 'border-green-600',
};

// Fonction pour remplacer les couleurs dans un fichier
function replaceColorsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    Object.entries(colorMappings).forEach(([from, to]) => {
      const beforeReplace = content;
      content = content.replace(new RegExp(from, 'g'), to);
      if (content !== beforeReplace) {
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Fonction pour traiter récursivement les fichiers
function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  let totalUpdated = 0;
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      totalUpdated += processDirectory(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      if (replaceColorsInFile(filePath)) {
        totalUpdated++;
      }
    }
  });
  
  return totalUpdated;
}

// Lancer le processus
console.log('🎨 Starting color update from blue to BeFret green...\n');

const srcPath = path.join(__dirname, '..', 'src');
const totalUpdated = processDirectory(srcPath);

console.log(`\n🎉 Color update completed!`);
console.log(`📊 Updated ${totalUpdated} files`);
console.log('🔧 Next steps:');
console.log('  1. Run: npm run build');
console.log('  2. Test the application');
console.log('  3. Deploy: npm run deploy:all');