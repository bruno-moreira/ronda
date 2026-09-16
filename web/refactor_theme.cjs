const fs = require('fs');
const path = require('path');

const replacements = {
  'bg-slate-950': 'bg-slate-50 dark:bg-slate-950',
  'text-slate-100': 'text-slate-900 dark:text-slate-100',
  'text-slate-200': 'text-slate-800 dark:text-slate-200',
  'text-slate-300': 'text-slate-700 dark:text-slate-300',
  'text-slate-400': 'text-slate-500 dark:text-slate-400',
  'bg-slate-900': 'bg-white dark:bg-slate-900',
  'bg-slate-800': 'bg-slate-100 dark:bg-slate-800',
  'hover:bg-slate-800/40': 'hover:bg-slate-100 dark:hover:bg-slate-800/40',
  'hover:bg-slate-800/50': 'hover:bg-slate-200 dark:hover:bg-slate-800/50',
  'hover:bg-slate-800': 'hover:bg-slate-200 dark:hover:bg-slate-800',
  'hover:bg-slate-700': 'hover:bg-slate-200 dark:hover:bg-slate-700',
  'border-slate-800/80': 'border-slate-200 dark:border-slate-800/80',
  'border-slate-800': 'border-slate-200 dark:border-slate-800',
  'border-slate-700': 'border-slate-300 dark:border-slate-700',
  'bg-slate-950/50': 'bg-slate-50/50 dark:bg-slate-950/50',
  'text-slate-950': 'text-white dark:text-slate-950',
  'bg-slate-800/40': 'bg-slate-100 dark:bg-slate-800/40'
};

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      for (const [key, value] of Object.entries(replacements)) {
        // Use word boundaries and negative lookbehind so we don't replace inside 'dark:bg-slate-950'
        // Since lookbehind doesn't work well with all characters in some regex engines, 
        // we can just use a simple regex and multiple passes if necessary, but negative lookbehind works in Node.
        const regex = new RegExp(`(?<!dark:)${key.replace(/[/]/g, '\\/')}`, 'g');
        content = content.replace(regex, value);
      }
      fs.writeFileSync(fullPath, content);
      console.log('Updated', fullPath);
    }
  }
}

processDirectory('/home/bruno/Documentos/ronda/web/src');
