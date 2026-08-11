import { useCallback } from 'react';

// 향후 서버에서 불러오거나 중앙 관리될 에셋 맵 (모의 데이터)
// 실제 앱에서는 이 부분이 API 호출을 통해 관리될 수 있습니다.
const UI_ASSETS = {
  btn_delete: '/assets/btn_delete.svg',
  btn_edit: '/assets/btn_edit.svg',
  btn_copy: '/assets/btn_copy.svg',
  // 필요 시 더 추가 가능
};

/**
 * UI 에셋 관리에 등록된 에셋을 가져와서 사용하기 위한 커스텀 훅
 * (사용자 규칙 13번 준수: 버튼, 아이콘 등은 직접 만들지 않고 이 훅을 통해 사용)
 */
export const useUiAssets = () => {
  const getAssetUrl = useCallback((assetName) => {
    // 에셋 맵에 있으면 해당 경로 반환, 없으면 빈 문자열(또는 플레이스홀더) 반환
    return UI_ASSETS[assetName] || ''; 
  }, []);

  return { getAssetUrl };
};
