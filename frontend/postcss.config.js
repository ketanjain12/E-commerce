// export default {
//     plugins: {
//       tailwindcss: {},
//       autoprefixer: {},
//     },
//   };
  
// export default {
//     plugins: [
//       require('@tailwindcss/postcss'),
//       require('tailwindcss'),
//       require('autoprefixer'),
//     ],
//   };

const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');

module.exports = {
  plugins: [
    tailwindcss(),
    autoprefixer(),
  ],
};
