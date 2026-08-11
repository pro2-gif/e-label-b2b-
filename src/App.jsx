import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* 기본 경로는 제품 목록 및 QR 코드 생성 화면 */}
        <Route path="/" element={<ProductList />} />
        
        {/* /product/:id 경로는 QR 코드를 스캔했을 때 나타나는 상세(e-라벨) 화면 */}
        <Route path="/product/:id" element={<ProductDetail />} />
      </Routes>
    </Router>
  );
}

export default App;
