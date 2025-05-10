import { createGlobalStyle } from "styled-components";

const GlobalStyles = createGlobalStyle`
  /* Pretendard 폰트 설정 */
  @import url('https://unpkg.com/pretendard/dist/web/static/pretendard.css');

  body {
    font-family: 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    min-width: 992px;
  }
`;

export default GlobalStyles;