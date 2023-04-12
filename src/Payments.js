import { useState } from 'react';
import './App.css';
import './Payments.css';
import { typeString, timeString, lengthString } from './utils';

const Row = ({children}) => {
    return <li className='row'>{children}</li>
}

const Payments = ({bookedSessions, setBookedSessions, user, users, setUsers}) => {
    const [currentUserId, setCurrentUserId] = useState(user.id)
    const [rate, setRate] = useState(users.find(u => u.id === currentUserId).rate)
    const [changeRate, setChangeRate] = useState(false)

    const handleCheckPaid = (e) => {
        const sesh = bookedSessions.find(s => s.id === e.target.value)
        const newSesh = {...sesh, paid: !sesh.paid}
        fetch('http://localhost:5000/sessions' + '/' + sesh.id, {
        method: 'PUT',
        headers: {
        'Content-type': 'application/json',
        },
        body: JSON.stringify(newSesh),
        })
        .then(() => {
            setBookedSessions(bookedSessions.map(s => s.id === sesh.id ? newSesh : s))
        })
    }

    const handleChangeRate = (e) => {
        if (changeRate){
            const currentUser = users.find(u => u.id === currentUserId)
            const newUser = {...currentUser, rate: Number(e.target.value)}
            fetch('http://localhost:5000/users' + '/' + currentUserId, {
            method: 'PUT',
            headers: {
            'Content-type': 'application/json',
            },
            body: JSON.stringify(newUser),
            })
            .then(() => {
                setUsers(users.map(u => u.id === currentUserId ? newUser : u))
            })
        }
        setChangeRate(!changeRate)
    }

    const userMenu = users.filter(u => !user.admin || u.id !== user.id).map(u => {
        return <option key={u.id} value={u.id}>{u.name}</option>})

    const header = 
        <Row key={"header"}>
            <div key={"name"} className='rowItem rowHeader'>Client</div>
            <div key={"type"} className='rowItem rowHeader'>Type</div>
            <div key={"date"} className='rowItem rowHeader'>Date</div>
            <div key={"time"} className='rowItem rowHeader'>Time</div>
            <div key={"length"} className='rowItem rowHeader'>Length</div>
            <div key={"cost"} className='rowItem rowHeader'>Cost</div>
            {user.admin && <div key={"paid"} className='rowItem rowHeader'>Paid</div>}
        </Row>

    const totalDue = 
        <Row key={"totalDue"}>
            <div className='rowItem rowHeader'>Total Due:</div>
            <div className='rowItem'>
                ${users.find(u => u.id === currentUserId).rate * bookedSessions.filter(sesh => sesh.user.id === currentUserId && !sesh.paid).map(sesh => sesh.length).reduce((a,b) => a+b, 0)}
            </div>
        </Row>

    return (
        <div>
            {user.admin &&
            <div className='userSelectorContainer'>
                <select value={currentUserId} onChange={(e) => {setRate(users.find(u => u.id === e.target.value).rate); setCurrentUserId(e.target.value)}} >
                    <option key={"header"} value={user.id}>All Users</option>
                    {userMenu}
                </select>
                {user.id !== currentUserId && <div className="rate">Hourly rate: </div>}
                {user.id !== currentUserId &&
                    (changeRate ?
                    <input className="amount editAmount" defaultValue={rate} onChange={(e) => setRate(e.target.value)}></input> :
                    <div className="amount">${users.find(u => u.id === currentUserId).rate}</div>)
                }
                {user.id !== currentUserId && <button value={rate} className="editButton" onClick={handleChangeRate}>{changeRate ? "Save Rate" : "Change Rate"}</button>}
            </div>}
            
            <ul className='gridContainer'>
                {header}
                {bookedSessions
                    .filter(sesh => (user.admin && user.id === currentUserId) ? true : sesh.user.id == currentUserId)
                    .map(sesh => {
                    return <Row key={sesh.id}>
                        <div key={"name"} className='rowItem'>{typeString(sesh.user.name)}</div>
                        <div key={"type"} className='rowItem'>{typeString(sesh.type)}</div>
                        <div key={"date"} className='rowItem'>{sesh.dateString}</div>
                        <div key={"time"} className='rowItem'>{timeString(sesh.time)}</div>
                        <div key={"length"} className='rowItem'>{lengthString(sesh.length)}</div>
                        <div key={"cost"} className={`rowItem ${sesh.paid ? "paid" : "unpaid"}`}>${users.find(u => u.id === sesh.user.id).rate * sesh.length}</div>
                        {user.admin && <input key={"paid"} value={sesh.id} checked={sesh.paid} onChange={handleCheckPaid} type="checkbox" />}
                    </Row>
                }) }
                {<Row key={"space"}/>}
                {(!user.admin || user.id !== currentUserId) && totalDue}    
            </ul>
        </div>
    )
}

export default Payments;