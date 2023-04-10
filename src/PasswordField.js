import { useState } from 'react';
import showEye from './show-password.svg';
import hideEye from './hide-password.svg';
import './App.css';

const PasswordField = ({placeholder, onChange}) => {
    const [showPassword, setShowPassword] = useState(false)

    return (    
        <div className='passwordContainer'>
            <input
                type={showPassword ? "text" : "password"}
                className='Login-field'
                placeholder={placeholder}
                onChange={onChange}
            />            
            <img
                title={showPassword ? "Hide password" : "Show password"}
                src={showPassword ? showEye : hideEye}
                onClick={() => setShowPassword(!showPassword)}
                />
        </div>
    )
}

export default PasswordField