import "styled-components";
import { ThemeType } from "./theme.ts";

declare module "styled-components" {
    export interface DefaultTheme extends ThemeType {}
}