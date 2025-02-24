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

  import tailwindcss from 'tailwindcss';
  import tailwindcss from '@tailwindcss/postcss';
  import autoprefixer from 'autoprefixer';
  
  export default {
    plugins: [
      tailwindcss,
      autoprefixer,
    ],
  };
  