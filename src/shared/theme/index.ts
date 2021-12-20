import { extendTheme, Theme } from "@chakra-ui/react";
import { createBreakpoints } from "@chakra-ui/theme-tools";
import { colors } from "./colors";
import { Heading } from "./components/heading";
import { Text } from "./components/text";
import {
  chakraFontsizeConfig,
  fontWeights,
  letterSpacings,
  lineHeights,
} from "./typography";

// This is the default breakpoint
const breakpoints = createBreakpoints({
  sm: "250px",
  md: "500px",
  lg: "62em",
  xl: "80em",
  "2xl": "96em",
});

const chakraTheme: Theme = extendTheme(
  {
    config: {
      initialColorMode: "light",
      useSystemColorMode: false,
    } as Theme["config"],
    fonts: {
      heading: `"Inter", -apple-system,BlinkMacSystemFont,"Segoe UI","Roboto","Oxygen","Ubuntu","Cantarell","Fira Sans","Droid Sans","Helvetica Neue",sans-serif`,
      body: `"Inter", -apple-system,BlinkMacSystemFont,"Segoe UI","Roboto","Oxygen","Ubuntu","Cantarell","Fira Sans","Droid Sans","Helvetica Neue",sans-serif`,
      mono: `'IBM Plex Mono', monospace`,
    },
    styles: {
      global: {
        "html, body": {
          backgroundColor: "transparent",
          padding: 0,
          margin: 0,
          fontFeatureSettings: `'zero' 1`,
        },
      },
    },
    components: {
      Heading,
      Text,
      Button: {
        baseStyle: {
          borderRadius: "md",
        },
      },
      Input: {
        sizes: {
          xl: {
            field: {
              fontSize: "lg",
              px: 4,
              h: 14,
              borderRadius: "md",
            },
            addon: {
              fontSize: "lg",
              px: 4,
              h: 14,
              borderRadius: "md",
            },
          },
        },
      },
    },
    colors,
    fontSizes: chakraFontsizeConfig,
    fontWeights,
    lineHeights,
    letterSpacings,
    sizes: {
      container: {
        page: "1170px",
      },
    },
    breakpoints,
  },
  // withDefaultColorScheme({ colorScheme: "primary" }),
) as Theme;

export default chakraTheme;
