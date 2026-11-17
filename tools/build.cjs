// npm install && npm run build; only generated JS/CSS change, app source remains editable.
const fs=require('fs'),path=require('path'),{transformSync}=require('@babel/core'),postcss=require('postcss'),tailwind=require('tailwindcss');
const base=path.resolve(__dirname,'..');
const jsx=fs.readFileSync(path.join(base,'src/index-app.jsx'),'utf8');
fs.mkdirSync(path.join(base,'assets/build'),{recursive:true});
fs.writeFileSync(path.join(base,'assets/build/index-app.js'),transformSync(jsx,{presets:[[require.resolve('@babel/preset-react'),{runtime:'classic'}]],comments:false,compact:true}).code);
postcss([tailwind({content:[path.join(base,'*.html'),path.join(base,'*.js'),path.join(base,'src/**/*.jsx')],theme:{extend:{}},plugins:[]})]).process('@tailwind base;@tailwind components;@tailwind utilities;',{from:undefined}).then(r=>fs.writeFileSync(path.join(base,'assets/build/ui.css'),r.css));
