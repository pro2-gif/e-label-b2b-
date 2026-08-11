import Papa from 'papaparse';

// 구글 시트를 CSV로 내보내는 기본 URL 형식 (시트 ID 필요)
const SHEET_ID = '1HgUatFemorfbnfclPD6EacodrU5atToxAS0oXGYZqj0';
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;

/**
 * 구글 스프레드시트의 데이터를 CSV 형태로 불러와 JSON 배열로 변환합니다.
 * @returns {Promise<Array>} 제품 데이터 객체 배열
 */
export const fetchSheetData = () => {
  return new Promise((resolve, reject) => {
    Papa.parse(SHEET_CSV_URL, {
      download: true,       // URL에서 직접 다운로드
      header: true,         // 첫 번째 행을 키(Key)로 사용
      skipEmptyLines: true, // 빈 줄 무시
      complete: (results) => {
        // results.data 에 변환된 JSON 객체 배열이 들어있습니다.
        resolve(results.data);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};
