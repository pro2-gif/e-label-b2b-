import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { fetchSheetData } from '../services/googleSheetService';
import { useUiAssets } from '../services/uiAssetService';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getAssetUrl } = useUiAssets();

  useEffect(() => {
    // 컴포넌트가 마운트되면 구글 시트 데이터를 가져옵니다.
    fetchSheetData()
      .then((data) => {
        // 빈 데이터 제외
        const validData = data.filter(item => Object.keys(item).some(key => item[key] !== ""));
        setProducts(validData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('데이터 가져오기 실패:', err);
        setError('데이터를 불러오는데 실패했습니다. 구글 시트 공유 권한을 확인해주세요.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div style={{ padding: 'var(--jt-space-6)', textAlign: 'center' }}>데이터를 불러오는 중입니다...</div>;
  }

  if (error) {
    return <div style={{ padding: 'var(--jt-space-6)', color: 'var(--jt-color-brand-900)', textAlign: 'center' }}>{error}</div>;
  }

  return (
    <div style={{ padding: 'var(--jt-space-6)', maxWidth: '800px', margin: '0 auto' }}>
      <h1 className="text-brand" style={{ marginBottom: 'var(--jt-space-6)' }}>제품 QR 라벨 관리</h1>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: 'var(--jt-space-4)'
      }}>
        {products.map((product, index) => {
          // 제품 식별을 위해 첫 번째 컬럼의 값을 가져오거나 인덱스를 사용합니다.
          const firstKey = Object.keys(product)[0];
          const productName = product[firstKey] || `제품 ${index + 1}`;
          
          // 현재 도메인 기반으로 상세 페이지 URL 생성 (QR 코드에 삽입될 주소)
          const detailUrl = `${window.location.origin}/product/${index}`;

          return (
            <div key={index} style={{
              backgroundColor: 'var(--jt-color-bg)',
              borderRadius: 'var(--jt-r-md)',
              padding: 'var(--jt-space-5)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: '0 0 var(--jt-space-4) 0', fontSize: '16px' }}>{productName}</h3>
              
              <div style={{ marginBottom: 'var(--jt-space-4)' }}>
                {/* QR 코드 생성 부분 */}
                <QRCodeSVG value={detailUrl} size={150} />
              </div>
              
              <div style={{ display: 'flex', gap: 'var(--jt-space-2)', width: '100%' }}>
                <Link 
                  to={`/product/${index}`}
                  style={{
                    flex: 1,
                    textDecoration: 'none',
                    display: 'inline-block',
                    padding: 'var(--jt-space-2) var(--jt-space-4)',
                    backgroundColor: 'var(--jt-color-accent)',
                    color: 'white',
                    borderRadius: 'var(--jt-r-sm)',
                    fontSize: '14px',
                    height: 'var(--jt-control-height)',
                    lineHeight: '20px'
                  }}
                >
                  상세보기
                </Link>
                {/* 만약 인쇄나 복사 등의 액션이 필요하다면 UI 에셋을 활용 */}
                {/* <button style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                  <img src={getAssetUrl('btn_copy')} alt="복사" width="36" height="36" />
                </button> */}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProductList;
