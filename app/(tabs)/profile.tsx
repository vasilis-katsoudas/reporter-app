import React, { useContext, useState } from 'react';
import ProfileView from "../../components/profileView";
import SideMenu from "../../components/sideMenu";
import { AuthContext } from '../../context/AuthContext';

//display authenticated user profile
export default function MyProfileTab() {
    const [menuVisible, setMenuVisible] = useState(false);
    const { logout } = useContext(AuthContext);

    return (
      <>
        <ProfileView onMenuPress={() => setMenuVisible(true)} />
        <SideMenu 
          visible={menuVisible} 
          onClose={() => setMenuVisible(false)} 
          logout={logout} 
        />
      </>
    );
}