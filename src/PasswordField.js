import { useState } from 'react';
import showEye from './images/show-password.svg';
import hideEye from './images/hide-password.svg';
import './App.css';

const PasswordField = ({placeholder, onChange}) => {
    const [showPassword, setShowPassword] = useState(false)

    return (    
        <div className='passwordContainer'>
            <input
                type={showPassword ? "text" : "password"}
                className='loginField'
                placeholder={placeholder}
                onChange={onChange}
            />            
            <img
                title={showPassword ? "Hide password" : "Show password"}
                src={showPassword ? showEye : hideEye}
                onClick={() => setShowPassword(!showPassword)}
                alt={showPassword ? "Hide" : "Show"}
                />
        </div>
    )
}

export default PasswordField