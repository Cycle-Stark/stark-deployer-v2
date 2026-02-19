import { createTheme, MantineColorsTuple, Paper } from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { Inter } from 'next/font/google';


const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const darkColor: MantineColorsTuple = ["#d0d0d0", "#b8b8b8", "#a0a0a0", "#888888", "#707070", "#585858", "#4d4d4d", "#363636", "#1f1e1e", "#080808"]
export const theme = createTheme({
  /* Put your mantine theme override here */
  colors: {
    darkColor,
  },
  primaryColor: "violet",
  fontFamily: inter.style.fontFamily,
  components: {
    Paper: Paper.extend({
      defaultProps: {
        // bg: "transparent"
      }
    }),
    Dropzone: Dropzone.extend({
      defaultProps: {
        bg: "transparent"
      }
    }),
  }
});
