import React from 'react';
import { Routes,Route,Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import {GuestLayout,AuthLayout} from './pages/Layout';
import HomePage from './pages/HomePage';
import BuilderPage from './pages/BuilderPage';
import PreviewPage from './pages/PreviewPage';
import PublishPage from './pages/PublishPage';
import {Toaster} from 'react-hot-toast';

const App = () => {
  return (
    <>
    <Toaster/>
    <Routes>
      {/* Login Routes */}
      <Route element ={<GuestLayout/>}>
      <Route path="/login" element={<AuthPage mode ="login"/>}/>
      <Route path="/register" element={<AuthPage mode ="register"/>}/>
      </Route>

       {/* Protected Routes */}
      <Route element ={<AuthLayout/>}>
      <Route path="/" element={<HomePage/>}/>
      <Route path="/builder/:id" element={<BuilderPage/>}/>
     <Route path="/preview/:id" element={<PreviewPage/>}/>
      </Route>


               {/* publicRoutes    */}
               <Route path = '/publish/:id'element = {<PublishPage/>}/>
        
      {/* catch-all */}
      <Route path ="*" element ={<Navigate to = "/" replace />}/>
    </Routes>
    </>
  );
}

export default App;