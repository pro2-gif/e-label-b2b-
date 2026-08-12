import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { fetchSheetData } from '../services/googleSheetService';

const translationCache = {
  "일차자극 테스트 완료 : 저자극 판정": "Primary irritation test completed: Hypoallergenic",
  "일차자극 테스트 완료: 저자극 판정": "Primary irritation test completed: Hypoallergenic",
  "일차자극 테스트 완료 : 저자극 판정 ": "Primary irritation test completed: Hypoallergenic",
  "구매하기": "Buy Now"
};

const translateToEnglish = async (text) => {
  if (!text || typeof text !== 'string') return text;
  
  // 먼저 캐시 및 하드코딩 사전 확인
  const cleanText = text.trim();
  if (translationCache[cleanText]) return translationCache[cleanText];
  
  // 캐시에 없는데 한글이 전혀 포함되어 있지 않다면(예: 이미 영어이거나 숫자) 번역 스킵
  if (!/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(text)) return text;

  try {
    const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ko|en`);
    const data = await response.json();
    if (data && data.responseData && data.responseData.translatedText) {
      translationCache[text] = data.responseData.translatedText;
      return data.responseData.translatedText;
    }
  } catch (error) {}
  return text;
};

// 텍스트와 URL이 섞인 문자열에서 URL만 제외하고 텍스트 부분만 번역하는 헬퍼 함수
const translateTextWithUrls = async (text) => {
  if (!text || typeof text !== 'string') return text;
  
  // 가장 확실한 하드코딩 치환: 정규식이 띄어쓰기/특수문자 때문에 실패하는 것을 방지
  if (text.includes('일차자극') || text.includes('저자극 판정')) {
    // URL만 쏙 빼내기
    const urlMatch = text.match(/(https?:\/\/[^\s]+)/);
    const url = urlMatch ? urlMatch[0] : '';
    return "Primary irritation test completed: Hypoallergenic | " + url;
  }
  
  let preTranslated = text.replace(/인체적용시험/gi, 'Human application test');
  preTranslated = preTranslated.replace(/구매하기/gi, 'Buy Now');
  preTranslated = preTranslated.replace(/용량/gi, 'Volume');
  preTranslated = preTranslated.replace(/제품명/gi, 'Product Name');
  
  const urlRegex = /(https?:\/\/[^\s|]+)/g;
  const parts = preTranslated.split(urlRegex);
  
  let translatedResult = '';
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part.match(urlRegex)) {
      translatedResult += part;
    } else if (part.trim() !== '') {
      const hasPipe = part.includes('|');
      let textToTranslate = part.replace(/\|/g, '').trim();
      
      // 이미 위에서 영어로 바뀌었거나 한글이 없으면 번역 스킵
      if (textToTranslate && /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(textToTranslate)) {
        const translated = await translateToEnglish(textToTranslate);
        translatedResult += translated + (hasPipe ? ' | ' : ' ');
      } else {
        translatedResult += textToTranslate + (hasPipe ? ' | ' : ' ');
      }
    } else {
      translatedResult += part;
    }
  }
  return translatedResult;
};

// 텍스트 내부 URL을 찾아 링크 또는 이미지로 변환
const TextWithLinks = ({ text, isEnglish }) => {
  if (!text || typeof text !== 'string') return <>{text}</>;
  
  // 영문 모드일 경우, 시트의 영문 칼럼 쪽에 실수로 한글이 들어있더라도 렌더링 직전에 무조건 영어로 덮어씌움
  let displayText = text;
  if (isEnglish) {
    displayText = displayText.replace(/일차자극\s*테스트\s*완료\s*[:\s]*저자극\s*판정/gi, 'Primary irritation test completed: Hypoallergenic');
    displayText = displayText.replace(/인체적용시험/gi, 'Human application test');
    displayText = displayText.replace(/구매하기/gi, 'Buy Now');
    displayText = displayText.replace(/제품명/gi, 'Product Name');
    displayText = displayText.replace(/용량/gi, 'Volume');
    
    // 이 외에도 영문 버전에 한글이 남아있다면 정규식으로 한글 부분만 싹 지우는 극단적 조치 (선택사항)
    // 하지만 고유명사나 필요한 한글이 지워질 수 있으므로, | 기호 주변 등 찌꺼기만 지웁니다.
    displayText = displayText.replace(/\|\s*$/g, '').trim(); // 끝에 파이프 남은거 제거
  }
  
  const urlRegex = /(https?:\/\/[^\s|]+)/g;
  const parts = displayText.split(urlRegex);
  
  return (
    <>
      {parts.map((part, index) => {
        if (part.match(urlRegex)) {
          const isImg = part.match(/\.(jpeg|jpg|gif|png|webp|svg|bmp)(\?.*)?$/i);
          if (isImg) {
            return (
              <span key={index} style={{ display: 'block', marginTop: 'var(--jt-space-2)' }}>
                <img 
                  src={part} 
                  alt="attached" 
                  style={{ maxWidth: '100%', height: 'auto', borderRadius: 'var(--jt-r-sm)', display: 'block' }} 
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <a 
                  href={part} 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ display: 'none', color: 'var(--jt-color-accent)', textDecoration: 'underline', wordBreak: 'break-all' }}
                >
                  {part}
                </a>
              </span>
            );
          }
          return (
            <a 
              key={index} 
              href={part} 
              target="_blank" 
              rel="noreferrer"
              style={{ color: 'var(--jt-color-accent)', textDecoration: 'underline', wordBreak: 'break-all' }}
            >
              {part}
            </a>
          );
        }
        
        // 영문 모드인데 여전히 한글이 포함된 텍스트 파트가 남아있다면 렌더링하지 않고 공백 반환 (강력한 제재)
        if (isEnglish && /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(part)) {
          // 단, 숫자가 포함되어 있거나 영어 알파벳이 포함되어 있으면 한글만 지우고 살림
          let englishOnly = part.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g, '');
          // 파이프 기호 등 불필요한 특수문자 정리
          englishOnly = englishOnly.replace(/\|/g, '').trim();
          return <span key={index}>{englishOnly}</span>;
        }
        
        return <span key={index}>{part}</span>;
      })}
    </>
  );
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEnglish, setIsEnglish] = useState(false);
  
  const [translatedProduct, setTranslatedProduct] = useState(null);
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('lang') === 'en') {
      setIsEnglish(true);
    }
  }, [location]);

  useEffect(() => {
    fetchSheetData()
      .then((data) => {
        const validData = data.filter(item => Object.keys(item).some(key => item[key] !== ""));
        const productIndex = parseInt(id, 10);
        
        if (productIndex >= 0 && productIndex < validData.length) {
          setProduct(validData[productIndex]);
        } else {
          setError(isEnglish ? 'Product not found.' : '해당 제품을 찾을 수 없습니다.');
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(isEnglish ? 'Failed to load data.' : '데이터를 불러오는데 실패했습니다.');
        setLoading(false);
      });
  }, [id, isEnglish]);

  useEffect(() => {
    if (!product) return;

    if (isEnglish) {
      setTranslating(true);
      const translateAll = async () => {
        const result = {};
        for (const [key, value] of Object.entries(product)) {
          if (!value || value.trim() === '') continue;
          
          const keyLower = key.toLowerCase();
          const isEngColumn = keyLower.includes('eng') || key.includes('영문');
          const isKorColumn = keyLower.includes('kor') || key.includes('국문');
          
          if (isKorColumn) continue;

          if (isEngColumn) {
            let cleanKey = key.replace(/\(영문\)|\(국문\)|ENG|KOR|\(\)/gi, '').trim() || key;
            const finalKey = await translateToEnglish(cleanKey);
            result[finalKey] = value;
          } else {
            let cleanKey = key.replace(/\(국문\)|\(영문\)|ENG|KOR|\(\)/gi, '').trim() || key;
            const translatedKey = await translateToEnglish(cleanKey);
            
            const isSingleUrl = value.toString().trim().startsWith('http') && !value.toString().includes(' ');
            if (isSingleUrl) {
              result[translatedKey] = value;
            } else {
              // 텍스트 안에 URL이 섞여 있을 수 있으므로 URL은 놔두고 텍스트만 번역
              result[translatedKey] = await translateTextWithUrls(value.toString());
            }
          }
        }
        setTranslatedProduct(result);
        setTranslating(false);
      };
      translateAll();
    }
  }, [isEnglish, product]);

  if (loading) {
    return <div style={{ padding: 'var(--jt-space-6)', textAlign: 'center' }}>
      {isEnglish ? 'Loading product...' : '제품 정보를 불러오는 중입니다...'}
    </div>;
  }

  if (error || !product) {
    return (
      <div style={{ padding: 'var(--jt-space-6)', textAlign: 'center' }}>
        <p style={{ color: 'var(--jt-color-brand-900)' }}>{error}</p>
        <button onClick={() => navigate('/')} style={{ marginTop: 'var(--jt-space-4)', padding: 'var(--jt-space-2) var(--jt-space-4)', backgroundColor: 'var(--jt-color-accent)', color: 'white', border: 'none', borderRadius: 'var(--jt-r-sm)', cursor: 'pointer' }}>
          {isEnglish ? 'Go back to Home' : '첫 화면으로 돌아가기'}
        </button>
      </div>
    );
  }

  const displayData = (isEnglish && translatedProduct) ? translatedProduct : product;
  
  let productName = isEnglish ? 'Product Details' : '제품 상세 정보';
  const firstKey = Object.keys(displayData)[0];
  if (displayData[firstKey]) productName = displayData[firstKey];

  const imageItems = [];
  let textItems = [];

  const isImageField = (key, val) => {
    if (typeof val !== 'string') return false;
    const trimmed = val.trim().toLowerCase();
    const isUrl = trimmed.startsWith('http://') || trimmed.startsWith('https://');
    if (!isUrl) return false;
    if (trimmed.includes(' ') || trimmed.includes('|')) return false; 
    
    const keyLower = key.toLowerCase();
    const hasImageWord = keyLower.includes('사진') || keyLower.includes('이미지') || keyLower.includes('image') || keyLower.includes('picture');
    const hasImageExt = trimmed.match(/\.(jpeg|jpg|gif|png|webp|svg|bmp)(\?.*)?$/) != null;
    
    return hasImageWord || hasImageExt;
  };

  Object.entries(displayData).map(([key, value]) => {
    if (!value || value.toString().trim() === '') return;
    
    const keyLower = key.toLowerCase();
    
    if (!isEnglish) {
      const isEngColumn = keyLower.includes('eng') || key.includes('영문');
      if (isEngColumn) return; 
    }

    let displayKey = key;
    if (!isEnglish) {
      displayKey = key.replace(/\(국문\)|\(영문\)|KOR|ENG|\(\)/gi, '').trim() || key;
    }

    if (keyLower.includes('제품명') || keyLower.includes('product name')) {
      productName = value;
    }

    if (isImageField(key, value.toString())) {
      imageItems.push({ key: displayKey, value });
    } else {
      textItems.push({ key: displayKey, value });
    }
  });

  textItems.sort((a, b) => {
    // 키 이름이 영어로 번역될 수 있으므로 checkout 등의 키워드도 추가
    const aLower = a.key.toLowerCase();
    const bLower = b.key.toLowerCase();
    
    const aIsPurchase = aLower.includes('구매') || aLower.includes('purchase') || aLower.includes('checkout') || aLower.includes('buy');
    const bIsPurchase = bLower.includes('구매') || bLower.includes('purchase') || bLower.includes('checkout') || bLower.includes('buy');
    
    if (aIsPurchase && !bIsPurchase) return 1;
    if (!aIsPurchase && bIsPurchase) return -1;
    return 0;
  });

  return (
    <div style={{ padding: '0', maxWidth: '600px', margin: '0 auto', backgroundColor: 'var(--jt-color-bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ backgroundColor: 'var(--jt-color-brand-900)', color: 'white', padding: 'var(--jt-space-5)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', lineHeight: '1.4' }}>{productName}</h2>
            <p style={{ margin: 'var(--jt-space-1) 0 0 0', fontSize: '13px', opacity: 0.8 }}>
              {isEnglish ? 'e-Label Information' : 'e-라벨 상세 정보'}
            </p>
          </div>
          <div style={{ display: 'flex', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 'var(--jt-r-sm)', padding: '2px' }}>
            <button onClick={() => setIsEnglish(false)} style={{ border: 'none', background: !isEnglish ? 'var(--jt-color-accent)' : 'transparent', color: 'white', padding: '4px 12px', borderRadius: '2px', fontSize: '13px', fontWeight: !isEnglish ? 'bold' : 'normal', cursor: 'pointer' }}>KOR</button>
            <button onClick={() => setIsEnglish(true)} style={{ border: 'none', background: isEnglish ? 'var(--jt-color-accent)' : 'transparent', color: 'white', padding: '4px 12px', borderRadius: '2px', fontSize: '13px', fontWeight: isEnglish ? 'bold' : 'normal', cursor: 'pointer' }}>ENG</button>
          </div>
        </div>
      </div>

      <div style={{ padding: 'var(--jt-space-4)' }}>
        {translating && isEnglish && !translatedProduct ? (
          <div style={{ textAlign: 'center', padding: 'var(--jt-space-8) 0', color: 'var(--jt-color-text-light)' }}>
            Translating to English... Please wait ⏳
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--jt-space-4)' }}>
            
            {imageItems.map((item, index) => (
              <div key={`img-${index}`} style={{ borderRadius: 'var(--jt-r-md)', overflow: 'hidden', backgroundColor: 'var(--jt-color-bg)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 'var(--jt-space-2)' }}>
                <img 
                  src={item.value.trim()} 
                  alt={item.key} 
                  style={{ maxWidth: '250px', maxHeight: '250px', width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }} 
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <a href={item.value.trim()} target="_blank" rel="noreferrer" style={{ display: 'none', padding: 'var(--jt-space-4)', color: 'var(--jt-color-accent)', wordBreak: 'break-all', fontSize: '14px' }}>
                  [{item.key}] Link: {item.value}
                </a>
              </div>
            ))}

            {textItems.map((item, index) => {
              const keyLower = item.key.toLowerCase();
              const isPurchase = keyLower.includes('구매') || keyLower.includes('purchase') || keyLower.includes('checkout') || keyLower.includes('buy');
              
              if (isPurchase) {
                return (
                  <div key={`text-${index}`} style={{ marginTop: 'var(--jt-space-4)', textAlign: 'center' }}>
                    <a href={item.value.trim()} target="_blank" rel="noreferrer" style={{ display: 'inline-block', width: '100%', padding: 'var(--jt-space-3) var(--jt-space-6)', backgroundColor: 'var(--jt-color-accent)', color: 'white', textDecoration: 'none', borderRadius: 'var(--jt-r-md)', fontWeight: 'bold', fontSize: '15px' }}>
                      {isEnglish ? 'Buy Now' : '구매하기'}
                    </a>
                  </div>
                );
              }

              return (
                <div key={`text-${index}`} style={{ backgroundColor: 'var(--jt-color-brand-50)', padding: 'var(--jt-space-4)', borderRadius: 'var(--jt-r-md)' }}>
                  <div style={{ fontSize: '13px', color: 'var(--jt-color-text-light)', fontWeight: 'bold', marginBottom: 'var(--jt-space-2)' }}>
                    {item.key}
                  </div>
                  <div style={{ fontSize: '15px', color: 'var(--jt-color-text)', lineHeight: '1.6', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    <TextWithLinks text={item.value} isEnglish={isEnglish} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <div style={{ padding: 'var(--jt-space-2) var(--jt-space-4) var(--jt-space-6)', textAlign: 'center' }}>
        <button 
          onClick={() => navigate('/')}
          style={{ width: '100%', padding: 'var(--jt-space-3) var(--jt-space-6)', backgroundColor: 'var(--jt-color-brand-900)', color: 'white', border: 'none', borderRadius: 'var(--jt-r-md)', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', height: '44px' }}
        >
          {isEnglish ? 'Go back to Home' : '첫 화면으로 돌아가기'}
        </button>
      </div>
    </div>
  );
};

export default ProductDetail;
