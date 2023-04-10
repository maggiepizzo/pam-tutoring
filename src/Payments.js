import { useState } from 'react';
import './App.css';
import './Payments.css';
import { typeString, timeString, lengthString } from './utils';

const Row = ({children}) => {
    return <li className='row'>{children}</li>
}

const Payments = ({bookedSessions, user, users}) => {
    const [currentUserId, setCurrentUserId] = useState(user.admin ? "" : user.id)
    const [sessions, setSessions] = useState(bookedSessions)

    const handleClick = (e) => {
        const sesh = sessions.find(s => s.id === e.target.value)
        const newSesh = {...sesh, paid: !sesh.paid}
        fetch('http://localhost:5000/sessions' + '/' + sesh.id, {
        method: 'PUT',
        headers: {
        'Content-type': 'application/json',
        },
        body: JSON.stringify(newSesh),
        })
        .then(() => {
            setSessions(sessions.map(s => s.id === sesh.id ? newSesh : s))
        })
    }

    let userSessions = {}
    for (const sesh of sessions) {
        const seshItem = 
            <Row id={sesh.id}>
                <div className='rowItem'>{typeString(sesh.type)}</div>
                <div className='rowItem'>{sesh.dateString}</div>
                <div className='rowItem'>{timeString(sesh.time)}</div>
                <div className='rowItem'>{lengthString(sesh.length)}</div>
                <div className={`rowItem ${sesh.paid ? "paid" : "unpaid"}`}>${users.find(u => u.id === sesh.user.id).rate * sesh.length}</div>
                {user.admin && <input value={sesh.id} defaultChecked={sesh.paid} onClick={handleClick} type="checkbox" />}
            </Row>
        if (sesh.user.id in userSessions) {
            userSessions[sesh.user.id].push(seshItem)
        } else {
            userSessions[sesh.user.id] = [seshItem]
        }
    }

    const userMenu = users.filter(u => u.id in userSessions).map(u => {
        return <option key={u.id} value={u.id}>{u.name}</option>})

    const header = 
        <Row id={"header"}>
            <div className='rowItem rowHeader'>Type</div>
            <div className='rowItem rowHeader'>Date</div>
            <div className='rowItem rowHeader'>Time</div>
            <div className='rowItem rowHeader'>Length</div>
            <div className='rowItem rowHeader'>Cost</div>
            {user.admin && <div className='rowItem rowHeader'>Paid</div>}
        </Row>

    return (
        <div>
            {user.admin && 
            <div className='userSelectorContainer'>
                <select value={currentUserId} onChange={(e) => setCurrentUserId(e.target.value)} >
                    <option key={"header"} value={""}>Select a User</option>
                    {userMenu}
                </select>
                {currentUserId && <div className="rate">Hourly rate: ${users.find(u => u.id === currentUserId).rate}</div>}
            </div>}

            {currentUserId && 
            <ul>
                {header}
                {userSessions[currentUserId]}
            </ul>}
        </div>
        
    )
}

export default Payments;