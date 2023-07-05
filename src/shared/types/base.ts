export interface ThemeProps {
  colorScheme: "light" | "dark";
  primaryColor: string;
}

export interface BaseEmbedProps extends ThemeProps {
  contractAddress: string;
}
