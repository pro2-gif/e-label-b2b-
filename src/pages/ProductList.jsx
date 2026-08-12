import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { fetchSheetData } from '../services/googleSheetService';
import { useUiAssets } from '../services/uiAssetService';

// 간단한 캐시 (첫 화면 드롭다운 제품명 번역용)
const translationCache = {};
const translateText = async (text) => {
  if (!text) return text;
  if (translationCache[text]) return translationCache[text];
  try {
    const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ko|en`);
    const data = await response.json();
    if (data?.responseData?.translatedText) {
      translationCache[text] = data.responseData.translatedText;
      return data.responseData.translatedText;
    }
  } catch (e) {}
  return text;
};

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(''); 
  const [isEnglish, setIsEnglish] = useState(false);
  const [englishProductNames, setEnglishProductNames] = useState({});

  useEffect(() => {
    fetchSheetData()
      .then((data) => {
        const validData = data.filter(item => Object.keys(item).some(key => item[key] !== ""));
        setProducts(validData);
        if (validData.length > 0) {
          setSelectedIndex('0');
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(isEnglish ? 'Failed to load data.' : '데이터를 불러오는데 실패했습니다.');
        setLoading(false);
      });
  }, []);

  // 영문 모드 시 제품명(드롭다운용) 추출 또는 번역
  useEffect(() => {
    if (isEnglish && products.length > 0) {
      const getNames = async () => {
        const newNames = { ...englishProductNames };
        for (let i = 0; i < products.length; i++) {
          const product = products[i];
          if (newNames[i]) continue; // 이미 캐시된 이름 있음
          
          let engName = '';
          const firstKey = Object.keys(product)[0];
          const koName = product[firstKey];
          
          // 1. 시트 내에 '영문'이 포함된 항목이 있는지 찾기
          const engKey = Object.keys(product).find(k => k.toLowerCase().includes('eng') || k.includes('영문'));
          if (engKey && product[engKey]) {
            engName = product[engKey];
          } else {
            // 2. 없으면 API 번역 시도
            engName = await translateText(koName);
          }
          newNames[i] = engName || koName;
        }
        setEnglishProductNames(newNames);
      };
      getNames();
    }
  }, [isEnglish, products]);

  if (loading) {
    return <div style={{ padding: 'var(--jt-space-6)', textAlign: 'center' }}>
      {isEnglish ? 'Loading data...' : '데이터를 불러오는 중입니다...'}
    </div>;
  }

  if (error) {
    return <div style={{ padding: 'var(--jt-space-6)', color: 'var(--jt-color-brand-900)', textAlign: 'center' }}>{error}</div>;
  }

  const selectedProduct = selectedIndex !== '' ? products[selectedIndex] : null;
  const langQuery = isEnglish ? '?lang=en' : '?lang=ko';
  const detailUrl = selectedIndex !== '' ? `${window.location.origin}/product/${selectedIndex}${langQuery}` : '';

  // 현재 선택된 제품의 렌더링용 이름
  let displayProductName = '';
  if (selectedProduct) {
    const firstKey = Object.keys(selectedProduct)[0];
    displayProductName = isEnglish 
      ? (englishProductNames[selectedIndex] || selectedProduct[firstKey] || `Product ${Number(selectedIndex) + 1}`) 
      : (selectedProduct[firstKey] || `제품 ${Number(selectedIndex) + 1}`);
  }

  return (
    <div style={{ padding: 'var(--jt-space-6)', maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--jt-space-4)' }}>
        <div style={{ display: 'flex', backgroundColor: 'var(--jt-color-brand-100)', borderRadius: 'var(--jt-r-sm)', padding: '2px' }}>
          <button
            onClick={() => setIsEnglish(false)}
            style={{
              border: 'none',
              background: !isEnglish ? 'var(--jt-color-brand-900)' : 'transparent',
              color: !isEnglish ? 'white' : 'var(--jt-color-text)',
              padding: '6px 16px',
              borderRadius: '2px',
              fontSize: '13px',
              fontWeight: !isEnglish ? 'bold' : 'normal',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            국문
          </button>
          <button
            onClick={() => setIsEnglish(true)}
            style={{
              border: 'none',
              background: isEnglish ? 'var(--jt-color-brand-900)' : 'transparent',
              color: isEnglish ? 'white' : 'var(--jt-color-text)',
              padding: '6px 16px',
              borderRadius: '2px',
              fontSize: '13px',
              fontWeight: isEnglish ? 'bold' : 'normal',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            ENG
          </button>
        </div>
      </div>

      <h1 className="text-brand" style={{ marginBottom: 'var(--jt-space-6)', textAlign: 'center' }}>
        {isEnglish ? 'QR e-Label System' : '제품 QR 라벨 발급'}
      </h1>
      
      <div style={{ width: '100%', marginBottom: 'var(--jt-space-6)' }}>
        <label htmlFor="product-select" style={{ display: 'block', marginBottom: 'var(--jt-space-2)', fontWeight: 'bold' }}>
          {isEnglish ? 'Select Product' : '제품 선택'}
        </label>
        <select
          id="product-select"
          value={selectedIndex}
          onChange={(e) => setSelectedIndex(e.target.value)}
          style={{
            width: '100%',
            height: 'var(--jt-control-height)',
            padding: '0 var(--jt-space-3)',
            borderRadius: 'var(--jt-r-md)',
            border: '1px solid var(--jt-color-brand-100)',
            backgroundColor: 'var(--jt-color-bg)',
            fontSize: '15px',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          {products.map((product, index) => {
            const firstKey = Object.keys(product)[0];
            const name = isEnglish 
              ? (englishProductNames[index] || product[firstKey] || `Product ${index + 1}`) 
              : (product[firstKey] || `제품 ${index + 1}`);
            return (
              <option key={index} value={index}>
                {name}
              </option>
            );
          })}
        </select>
      </div>

      {selectedProduct && (
        <div style={{
          backgroundColor: 'var(--jt-color-bg)',
          borderRadius: 'var(--jt-r-md)',
          padding: 'var(--jt-space-6)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          width: '100%'
        }}>
          <h3 style={{ margin: '0 0 var(--jt-space-4) 0', fontSize: '18px' }}>
            {displayProductName}
          </h3>
          
          <div style={{ marginBottom: 'var(--jt-space-5)', padding: 'var(--jt-space-2)', backgroundColor: 'white', borderRadius: 'var(--jt-r-sm)' }}>
            <QRCodeSVG value={detailUrl} size={200} />
          </div>
          
          <Link 
            to={`/product/${selectedIndex}${langQuery}`}
            style={{
              textDecoration: 'none',
              display: 'inline-block',
              padding: '0 var(--jt-space-6)',
              backgroundColor: 'var(--jt-color-accent)',
              color: 'white',
              borderRadius: 'var(--jt-r-sm)',
              fontSize: '15px',
              height: 'var(--jt-control-height)',
              lineHeight: 'var(--jt-control-height)',
              width: '100%'
            }}
          >
            {isEnglish ? 'View Product Info' : '제품 정보 보기'}
          </Link>
        </div>
      )}
    </div>
  );
};

export default ProductList;
