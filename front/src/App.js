import './App.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from './components/Home';
import AppCom from './components/AppCom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<Home />} />
        <Route path='app' element={<AppCom />} />
      </Routes>
    </BrowserRouter >
  );
}

export default App;
