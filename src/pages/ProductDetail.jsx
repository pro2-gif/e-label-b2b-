import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchSheetData } from '../services/googleSheetService';

const ProductDetail = () => {
  const { id } = useParams(); // URL 파라미터에서 제품 인덱스를 가져옵니다.
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSheetData()
      .then((data) => {
        // 빈 데이터 필터링
        const validData = data.filter(item => Object.keys(item).some(key => item[key] !== ""));
        
        const productIndex = parseInt(id, 10);
        if (productIndex >= 0 && productIndex < validData.length) {
          setProduct(validData[productIndex]);
        } else {
          setError('해당 제품을 찾을 수 없습니다.');
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('데이터 가져오기 실패:', err);
        setError('데이터를 불러오는데 실패했습니다.');
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div style={{ padding: 'var(--jt-space-6)', textAlign: 'center' }}>제품 정보를 불러오는 중입니다...</div>;
  }

  if (error || !product) {
    return (
      <div style={{ padding: 'var(--jt-space-6)', textAlign: 'center' }}>
        <p style={{ color: 'var(--jt-color-brand-900)' }}>{error}</p>
        <button 
          onClick={() => navigate('/')}
          style={{
            marginTop: 'var(--jt-space-4)',
            padding: 'var(--jt-space-2) var(--jt-space-4)',
            backgroundColor: 'var(--jt-color-accent)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--jt-r-sm)',
            cursor: 'pointer',
            height: 'var(--jt-control-height)'
          }}
        >
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  // 제품명으로 사용할 첫 번째 키 확인
  const firstKey = Object.keys(product)[0];
  const productName = product[firstKey] || '제품 상세 정보';

  return (
    <div style={{ 
      padding: 'var(--jt-space-4)', 
      maxWidth: '600px', 
      margin: '0 auto',
      backgroundColor: 'var(--jt-color-bg)',
      minHeight: '100vh'
    }}>
      <div style={{
        backgroundColor: 'var(--jt-color-brand-900)',
        color: 'white',
        padding: 'var(--jt-space-5)',
        borderRadius: 'var(--jt-r-md) var(--jt-r-md) 0 0',
        marginBottom: 'var(--jt-space-4)'
      }}>
        <h2 style={{ margin: 0, fontSize: '20px' }}>{productName}</h2>
        <p style={{ margin: 'var(--jt-space-2) 0 0 0', fontSize: '14px', opacity: 0.8 }}>e-라벨 상세 정보</p>
      </div>

      <div style={{
        padding: 'var(--jt-space-2)'
      }}>
        {Object.entries(product).map(([key, value], index) => {
          // 값이 없는 항목은 건너뛰거나, 첫 번째 키(이미 제목으로 표시됨)라면 건너뛸지 결정합니다.
          if (!value || value.trim() === '') return null;
          
          return (
            <div key={index} style={{
              borderBottom: '1px solid var(--jt-color-brand-50)',
              padding: 'var(--jt-space-4) 0',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--jt-space-1)'
            }}>
              <span style={{ 
                fontSize: '13px', 
                color: 'var(--jt-color-text-light)',
                fontWeight: 'bold'
              }}>{key}</span>
              <span style={{ 
                fontSize: '15px', 
                color: 'var(--jt-color-text)',
                lineHeight: '1.5',
                wordBreak: 'break-word'
              }}>{value}</span>
            </div>
          );
        })}
      </div>
      
      <div style={{ marginTop: 'var(--jt-space-6)', textAlign: 'center', paddingBottom: 'var(--jt-space-6)' }}>
        <button 
          onClick={() => navigate('/')}
          style={{
            padding: 'var(--jt-space-2) var(--jt-space-6)',
            backgroundColor: 'var(--jt-color-brand-50)',
            color: 'var(--jt-color-text)',
            border: 'none',
            borderRadius: 'var(--jt-r-sm)',
            cursor: 'pointer',
            height: 'var(--jt-control-height)'
          }}
        >
          목록으로 돌아가기
        </button>
      </div>
    </div>
  );
};

export default ProductDetail;
