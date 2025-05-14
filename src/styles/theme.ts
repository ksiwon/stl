// styles/theme.ts
import { DefaultTheme } from "styled-components";

export const theme: DefaultTheme = {
    colors: {
        primary: "#A332FF",
        white: "#FFFFFF",
        black: "#111111",
        gray: {
            600: "#666666",
            300: "#AFAFAF",
            200: "#DFDFDF",
            100: "#F8F8F8",
        },
        red: {
            600: "#FA5858",
            300: "#F0ACAC",
            100: "#FDE2E2",
        },
        green: {
            600: "#107F4F",
            300: "#8DD097",
        },
        blue: {
            600: "#107AC6",
            100: "#E5E2FD",
        },
        purple: {
            300: "#D39CFF",
            100: "#F2E3FF",
        },
        yellow: {
            600: "#DBD51F",
        },
        turkey: {
            600: "#20B6B6",
        },
    },
    typography: {
        T1: {
            fontFamily: "Pretendard",
            fontWeight: 800, // ExtraBold
            fontSize: "36px",
            lineHeight: "auto",
        },
        T2: {
            fontFamily: "Pretendard",
            fontWeight: 700, // Bold
            fontSize: "24px",
            lineHeight: "auto",
        },
        T3: {
            fontFamily: "Pretendard",
            fontWeight: 600, // SemiBold
            fontSize: "20px",
            lineHeight: "auto",
        },
        T4: {
            fontFamily: "Pretendard",
            fontWeight: 600, // SemiBold
            fontSize: "18px",
            lineHeight: "auto",
        },
        T5: {
            fontFamily: "Pretendard",
            fontWeight: 500, // Medium
            fontSize: "16px",
            lineHeight: "auto",
        },
        T6: {
            fontFamily: "Pretendard",
            fontWeight: 500, // Medium
            fontSize: "14px",
            lineHeight: "20px",
        },
        T7: {
            fontFamily: "Pretendard",
            fontWeight: 400, // Regular
            fontSize: "12px",
            lineHeight: "auto",
        },
    },
};

export type ThemeType = typeof theme;