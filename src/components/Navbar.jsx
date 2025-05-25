/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState } from "react";
import { Link } from "react-router-dom"; // Import Link from React Router
import { HiOutlineBars3 } from "react-icons/hi2";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import HomeIcon from "@mui/icons-material/Home";
import InfoIcon from "@mui/icons-material/Info";
import LoginIcon from '@mui/icons-material/Login';



const Navbar = () => {
  const [openMenu, setOpenMenu] = useState(false);

  const menuOptions = [
    { text: "Home", icon: <HomeIcon />, path: "/" },
    { text: "About", icon: <InfoIcon />, path: "/about" },
    { text: "Log In", icon: <LoginIcon />, path: "/signin" },

    
  ];

  return (
    <nav>
      <figure className="nav-logo-container">
        <img
          src="/favicon.ico"
          alt="Inerk Hub Logo"
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "2px solid #B1EDE8",
            objectFit: "cover"
          }}
        />      </figure>
      <menu className="navbar-links-container">
        <Link to="/">Home</Link>
        <Link to="/about" state={{ fromNavbar: true }}>About</Link>
        <Link to="/signin" state={{ fromNavbar: true }}>Login</Link>
        

      </menu>
      <section className="navbar-menu-container">
        <HiOutlineBars3 sx={{ color: "white" }} onClick={() => setOpenMenu(true)} />
      </section>
      <Drawer open={openMenu} onClose={() => setOpenMenu(false)} anchor="right">
        <Box
          sx={{ width: 250 }}
          role="presentation"
          onClick={() => setOpenMenu(false)}
          onKeyDown={() => setOpenMenu(false)}
        >
          <List>
            {menuOptions.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton component={Link} to={item.path}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider />
        </Box>
      </Drawer>
    </nav>
  );
};

export default Navbar;
