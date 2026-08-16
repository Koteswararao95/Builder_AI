import React from 'react';
import { Outlet,Navigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext.jsx';
import Loading from '../components/Loading.jsx'


export function AuthLayout(){
    const {user,loadingUser} = useAppContext()

    if(loadingUser) return <Loading/>
    if(!user) return <Navigate to = "/login" replace/>

    return <Outlet/>
}

export function GuestLayout(){
    const {user,loadingUser} = useAppContext()

    if(loadingUser) return <Loading/>
    if(user) return <Navigate to = "/" replace/>

    return <Outlet/>
}