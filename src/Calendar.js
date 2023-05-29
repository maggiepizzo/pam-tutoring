// https://justacoding.blog/react-calendar-component-example-with-events/
import { useState, Fragment } from 'react';
import { v4 as uuid } from 'uuid';
import './Calendar.css'
import './Loader.css'
import { typeString, timeString, lengthString } from './utils';
import { doc, setDoc, deleteDoc } from "firebase/firestore"; 
import _ from 'lodash';

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
]

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const DAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

const START_TIME = 8

const END_TIME = 22

const toStartOfDay = (date) => {
	const newDate = new Date(date)
    newDate.setHours(0)
    newDate.setMinutes(0)
    newDate.setSeconds(0)
    newDate.setMilliseconds(0)
    return newDate
}

const findEventsForDate = (events, dateString) => {
    let dateEvents = events.filter(event => {
        return event.dateString === dateString
    })
    return dateEvents.sort(function (a, b) {
        return a.time - b.time;
    })
}

const findAvailabilityForDate = (availability, specialAvailability, dateString, day) => {
  return {
    "special" : specialAvailability.find(a => a.dateString === dateString),
    "recurring" : availability.find(a => a.day === day)
  }
}

const getTimeArray = (start, end, step) => {
    var list = [];
    for (var i = start; i <= end; i+=step) {
        list.push(i);
    }
    return list
}

const SlotPicker = ({slot, disabled, event, setEvent}) => {
  const [timeSlot, setTimeSlot] = useState(slot)

  // 21 is the absolute max end time, in case the current start time is the latest one in our list
  const endTimes = event.times.map(t => t.time).filter(t => t > slot.time)
  const maxEndTime = Math.min(...endTimes, END_TIME)

  // 8 is the absolute min start time, in case the current start time is the earliest one in our list
  const startTimes = event.times.map(t => t.time + t.length).filter(t => t <= slot.time)
  const minStartTime = Math.max(...startTimes, START_TIME)
  
  const maxLength = maxEndTime - slot.time
  const minLength = 0.5
  const step = 0.25

  return(
      <div className="slotPicker">
        
        <label>Start Time
        <select disabled={disabled} value={timeSlot.time} onChange={(e) => {
          const newTimeSlot = {...timeSlot, time: Number(e.target.value)}
          setTimeSlot(() => newTimeSlot)
          const newTimes = event.times.map(t => t.id === timeSlot.id ? newTimeSlot : t)
          setEvent({ ...event, times: newTimes})
          }}>
          {getTimeArray(minStartTime, maxEndTime - minLength, step).map(time => <option key={time} value={time}>{timeString(time)}</option>)}
        </select>
        </label>
            
        <label>Length
        <select disabled={disabled} value={timeSlot.length} onChange={(e) => {
            const newTimeSlot = { ...timeSlot, length: Number(e.target.value) }
            setTimeSlot(() => newTimeSlot)    
            const newTimes = event.times.map(t => t.id === timeSlot.id ? newTimeSlot : t)
            setEvent({ ...event, times: newTimes})
            }}>
            {getTimeArray(minLength, maxLength, step).map(length => <option key={length} value={length}>{lengthString(length)}</option>)}
        </select>
        </label>

        <button disabled={disabled} className='remove' onClick={() => {
                const newTimes = event.times.filter(t => t.id !== timeSlot.id)
                setEvent({ ...event, times: newTimes})
              }}>x</button>
      </div>)
}

// Top bar, contains the month/year combo as well as back/forward links
const Navigation = ({ date, setDate, setShowingEventForm }) => {
  return (
    <div className="navigation">
      <div className="back" onClick={() => {
          const newDate = new Date(date)
          newDate.setDate(newDate.getDate() - 7)
          setDate(newDate)
        }}>
          <i className="arrow left"></i> Previous Week
      </div>

      <div className="today" onClick={() => setDate(new Date())}>Today</div>

      <div className="monthAndYear">
        {MONTHS[date.getMonth()]} {date.getFullYear()}
      </div>

      <div className="forward" onClick={() => {
          const newDate = new Date(date)
          newDate.setDate(newDate.getDate() + 7)
          setDate(newDate)
        }}>
          Next Week <i className="arrow right"></i>
      </div>
    </div>
  )
}

// Week day headers: Mon, Tue, Wed etc
const DayLabels = () => {
  return DAYS_SHORT.map((dayLabel, index) => {
    return <div className="dayLabel cell" key={index}>{dayLabel}</div>
  })
}

// An event displayed within the calendar grid for available time slots (CANNOT be clicked)
const MiniAvailableEvent = ({ event }) => {
  const top = String(100 * (event.time-START_TIME+2) / (END_TIME-START_TIME+3)) + "%"
  const height = String(100 * event.length / (END_TIME-START_TIME+3) - 0.5) + "%"
  return (
      <button
      className={`miniEvent available`}
      style={{top: top, height: height}}
      disabled={true}>
      {timeString(event.time)} for {lengthString(event.length)}
      </button>
  )
}

// An event displayed within the calendar grid, can be clicked to open main event view
const MiniEvent = ({ event, setViewingEvent, admin }) => {
  const top = String(100 * (event.time-START_TIME+2) / (END_TIME-START_TIME+3)) + "%"
  const height = String(100 * event.length / (END_TIME-START_TIME+3) - 0.5) + "%"
  return (
      <button
      className={`miniEvent ${event.type}`}
      style={{top: top, height: height}}
      disabled={Date.parse(event.date) < toStartOfDay(new Date())}
      onClick={() => setViewingEvent(event)}>
      {admin ? `${event.user.name} at ${timeString(event.time)}` : `${timeString(event.time)} for ${lengthString(event.length)}`}
      </button>
  )
}

// The main event view (opens in modal)
const Event = ({ event, setViewingEvent, setShowingEventForm, deleteEvent, availability, specialAvailability, bookedSessions, admin }) => {
  const title = (admin ? `${event.user.name}: ` : "") + 
  `${event.dateString} at ${timeString(event.time)} for ${lengthString(event.length)} (${typeString(event.type)})`
   
  const dateAvailabilityObject = findAvailabilityForDate(availability, specialAvailability, event.dateString, event.day)
  const dateAvailability = dateAvailabilityObject.special ?? dateAvailabilityObject.recurring
  // get all the sessions for this day EXCEPT the one I'm editing (that should stay a timeslot option)
  const prebookedSessions = findEventsForDate(bookedSessions, event.dateString).filter(sesh => sesh.id != event.id)

  return (
    <Modal onClose={() => setViewingEvent(null)} title={title} className="eventModal">
      <p>{event.meta && "Notes: " + event.meta}</p>
      <div style={{display: 'flex'}}>
        <button 
            onClick={() => {
                setViewingEvent(null)
                setShowingEventForm({ visible: true, withEvent: event, dateAvailability: dateAvailability, prebookedSessions: prebookedSessions})
            }}>
            Edit Session
        </button>
        <button className="red" onClick={() => deleteEvent(event)}>
            Delete Session
        </button>
      </div>
      <a className="close" onClick={() => setViewingEvent(null)}/>
    </Modal>
  )
}

// Form to add new sessions and edit existing sessions
const EventForm = ({ setShowingEventForm, addEvent, editEvent, withEvent, setViewingEvent, preselectedDate, dateAvailability, prebookedSessions, user, users }) => {
  const bookedStartTimes = prebookedSessions.map(sesh => sesh.time)
  const timeSlots = dateAvailability.times.filter(s => !bookedStartTimes.includes(s.time))
  const defaultTime = timeSlots[0].time
  const defaultLength = timeSlots[0].length
  const defaultUser = user.admin ? users[0] : user
  const defaultType = 'in-person'
  
  const newEvent = withEvent || {
    id: uuid(),
    type: defaultType,
    day: preselectedDate.getDay(),
    date: preselectedDate,
    dateString: preselectedDate.toDateString(), 
    time: defaultTime, 
    length: defaultLength,
    user: {id: defaultUser.id, email: defaultUser.email, name: defaultUser.name},
    paid: false
  }
  
  const [event, setEvent] = useState(newEvent)

  return (
    <Modal onClose={() => setShowingEventForm({ visible: false })} title={`${withEvent ? "Edit Session" : "Schedule New Session"}`}>
      <div className="form">
        
        <label>Date
        <select disabled={true}>
            <option value={event.date}>{event.dateString}</option>
          </select>
        </label>
        
        <label>Time
          <select 
          value={event.time}
          onChange={(e) => {
            const time = Number(e.target.value)
            const length = timeSlots.find(slot => slot.time === time).length
            setEvent({ ...event, 
              time: time,
              length: length})
        }}>
            {timeSlots.map(slot => 
              <option key={slot.id} value={slot.time}>
                {timeString(slot.time)} for {lengthString(slot.length)}
              </option>)}
          </select>
        </label>

       <label>Type
          <select 
          value={event.type}
          onChange={(e) => setEvent({ ...event, type: e.target.value })}>
            <option value="in-person">In person</option>
            <option value="remote">Remote</option>
          </select>
        </label>

        <label>Details
          <input 
            type="text" 
            placeholder="Any additional details" 
            defaultValue={event.meta} 
            onChange={(e) => setEvent({ ...event, meta: e.target.value })} />
        </label>

        {user.admin && 
        <label>User
          <select
            onChange={(e) => {
              const newUser = users.find(u => e.target.value === u.id)
              setEvent({...event, user: {id: newUser.id, email: newUser.email, name: newUser.name}})
              }}>
            {users.map(u => <option value={u.id}>{u.name}</option>)}
          </select>
        </label>}

        {withEvent ? (
        	<Fragment>
            <button 
              onClick={() => editEvent(event)} 
              disabled={_.isEqual(event, withEvent)}>
                Save Session
            </button>
            <a className="close" onClick={() => {
            	setShowingEventForm({ visible: false })
            	setViewingEvent(null)}
            }/>
          </Fragment>
        ) : (
        	<Fragment>
            <button onClick={() => addEvent(event)}>Schedule Session</button>
            <a className="close" onClick={() => {
                setShowingEventForm({ visible: false })}
            }/>
          </Fragment>
        )}
      </div>
    </Modal>
  )
}

// Form for admin to edit availability
const AvailabilityForm = ({ 
      setShowingAvailabilityForm, 
      preselectedDate, 
      prebookedSessions, 
      withEvent, 
      addAvailability,
      editAvailability, 
      addSpecialAvailability,
      editSpecialAvailability }) => {

    const recurringEvent = withEvent.recurring ? withEvent.recurring : {
        id: uuid(),
        day: preselectedDate.getDay(),
        times: [{id: uuid(), time: START_TIME, length: 1}],
    }

    const specialEvent = withEvent.special ? withEvent.special : {
      id: uuid(),
      day: preselectedDate.getDay(),
      date: preselectedDate,
      dateString: preselectedDate.toDateString(),
      // if we don't have a special schedule for this date, start with the recurring times as a base
      times: withEvent.recurring ? withEvent.recurring.times : [],
    }

    const [event, setEvent] = useState(withEvent.special ? specialEvent : recurringEvent)
    const [recurring, setRecurring] = useState(withEvent.special ? false : true)
    const date = preselectedDate.getDate()
    const dateString = preselectedDate.toDateString()
    const bookedStartTimes = prebookedSessions.map(sesh => sesh.time)

    const lastSession = event.times[event.times.length-1]
    const roomForAnotherSession = !lastSession || lastSession.time + lastSession.length + 0.5 <= END_TIME

    const handleAddSlotPicker = () => {
      const lastSlot = event.times[event.times.length-1]
      const startTime = lastSlot ? lastSlot.time + lastSlot.length : START_TIME
      setEvent({...event, times: event.times.concat([{id: uuid(), time: startTime, length: 1}])})  
    }

    return (
      <Modal onClose={() => setShowingAvailabilityForm({ visible: false })} title={`Edit Availability`}>
        <div className="form">
          
          <label>Date
          <select value={date} disabled={true} >
              <option value={date}>{dateString}</option>
            </select>
          </label>

          <label>Frequency
            <select 
            value={recurring}
            onChange={(e) => {
              setRecurring(!recurring)
              setEvent(recurring ? specialEvent : recurringEvent) // swap the previous order (recurring not updated yet)
              }}>
              <option value={true}>Every {DAYS_LONG[event.day]}</option>
              <option value={false}>Just today ({dateString})</option>
            </select>
          </label>

          {event.times.length > 0 ?
           event.times.map(slot => 
            <SlotPicker 
              key={slot.id} 
              slot={slot} 
              disabled={bookedStartTimes.includes(slot.time)} 
              event={event} 
              setEvent={setEvent}/>):
            <p>No availability.</p>
          }
          
          <button 
            onClick={handleAddSlotPicker} 
            disabled={!roomForAnotherSession}>
            Add Slot +
          </button>

          <Fragment>
            <button 
              onClick={() => recurring ? (withEvent.recurring ? editAvailability(event) : addAvailability(event)) : (withEvent.special ? editSpecialAvailability(event) : addSpecialAvailability(event))}
              disabled={_.isEqual(event, withEvent)} >
              Save Availability
            </button>
            <a className="close" onClick={() => {
                setShowingAvailabilityForm({ visible: false })}
            }/>
          </Fragment>

        </div>
      </Modal>
    )
  }

// Generic component - modal to present children within
const Modal = ({ children, onClose, title, className }) => {
  return (
    <Fragment>
      <div className="overlay" onClick={onClose} />
      <div className={`modal ${className}`}>
        <h3>{title}</h3>
        <div className="inner">
          {children}
        </div>
      </div>
    </Fragment>
  )
}

// Generic component - a nicely animated loading spinner
const Loader = () => {
  return (
    <Fragment>
      <div className="overlay" />
      <div className="loader">
        <div className="lds-roller">
          <div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>  
        </div>
      </div>
    </Fragment>
  )
}

// Generic component - simple feedback after an action has taken place
const Feedback = ({ message, type }) => {
  return (
    <div className={`feedback ${type}`}>{message}</div>
  )
}

// Renders a week's worth of days and also populates the bookedSessions on the relevant dates
const Grid = ({ date, bookedSessions, availability, specialAvailability, setViewingEvent, setShowingEventForm, setShowingAvailabilityForm, actualDate, user }) => {
  const DAYS_IN_WEEK = 7

  const currentDate = toStartOfDay(new Date())
  const startingDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay())
  
  const dates = []
  for (let i = 0; i < DAYS_IN_WEEK; i++) {
    const date = new Date(startingDate)
    const dateBookedSessions = findEventsForDate(bookedSessions, date.toDateString())
    const dateAvailabilityObject = findAvailabilityForDate(availability, specialAvailability, date.toDateString(), date.getDay())
    const dateAvailability = dateAvailabilityObject.special ?? dateAvailabilityObject.recurring
    const bookedStartTimes = dateBookedSessions.map(sesh => sesh.time)
    const availableSlots = dateAvailability ? dateAvailability.times.filter(s => !bookedStartTimes.includes(s.time)) : []
    const displayEvents = dateBookedSessions.filter(sesh => user.admin || sesh.user.id === user.id).map(event => 
      <MiniEvent key={event.id} event={event} setViewingEvent={setViewingEvent} admin={user.admin} />)
      .concat(availableSlots.map(event => 
      <MiniAvailableEvent key={event.id} event={event} />))
      .sort(function(a, b) {
        return a.props.event.time - b.props.event.time
      })

    dates.push({ 
      date, 
      bookedSessions: dateBookedSessions, 
      availability: dateAvailabilityObject, 
      availableSlots: availableSlots, 
      displayEvents: displayEvents })
    startingDate.setDate(startingDate.getDate() + 1)
  }

  return (
    <Fragment>
      {dates.map((date, index) => {
        return (
          <div 
            key={index}
            className={`cell ${date.date.getTime() === currentDate.getTime() ? "current" : ""} ${date.date.getMonth() != actualDate.getMonth() ? "otherMonth" : ""}`
						}>
            <div className="dateContainer">
                <div className="date">
                    {date.date.getDate()}
                </div>
                {date.date >= currentDate && date.availableSlots.length > 0 &&
                    <a 
                        className="addEventOnDay" 
                        onClick={() => setShowingEventForm({ visible: true, preselectedDate: date.date, dateAvailability: date.availability.special ?? date.availability.recurring, prebookedSessions: date.bookedSessions })}>
                        Book Session
                    </a>}
                {user.admin && date.date >= currentDate &&
                    <a 
                        className="addEventOnDay" 
                        onClick={() => setShowingAvailabilityForm({ visible: true, withEvent: date.availability, preselectedDate: date.date, prebookedSessions: date.bookedSessions })}>
                        {date.availability.recurring || date.availability.special ? 
                        "Edit Availability" :
                        "Add Availability +"}
                    </a>}
            </div>
            {date.displayEvents}
          </div>
        )
      })}
    </Fragment>
  )
}

// The "main" component, our actual calendar
const Calendar = ({ 
    bookedSessions, 
    setBookedSessions,
    availability, 
    setAvailability,
    specialAvailability,
    setSpecialAvailability,
    user, 
    users,
    db }) => {
  const [date, setDate] = useState(new Date())
  const [viewingEvent, setViewingEvent] = useState(null)
  const [showingEventForm, setShowingEventForm] = useState({ visible: false })
  const [showingAvailabilityForm, setShowingAvailabilityForm] = useState( { visible: false })
  const [isLoading, setIsLoading] = useState(false)
  const [feedback, setFeedback] = useState()

  const showFeedback = ({ message, type, timeout = 1000 }) => {
    setFeedback({ message, type })
    setTimeout(() => {
      setFeedback(null)
    }, timeout)
  }

  const addSpecialAvailability = (event) => {
    setIsLoading(true)
    setShowingAvailabilityForm({ visible: false })
    setDoc(doc(db, "specialAvailability", event.id), event)
    .then(() => {
      setSpecialAvailability(specialAvailability.concat([event]))
      setIsLoading(false)
      showFeedback({ message: "Availability added", type: "success" })
    })
  }

  const editSpecialAvailability = (event) => {
    setIsLoading(true)
    setShowingAvailabilityForm({ visible: false })
    setDoc(doc(db, "specialAvailability", event.id), event)
    .then(() => {
      setSpecialAvailability(specialAvailability.map(e =>  e.id === event.id ? event : e))
      setIsLoading(false)
      showFeedback({ message: "Availability saved", type: "success" })
    })
  }

  const addAvailability = (event) => {
    setIsLoading(true)
    setShowingAvailabilityForm({ visible: false })
    setDoc(doc(db, "availability", event.id), event)
    .then(() => {
      setAvailability(availability.concat([event]))
      setIsLoading(false)
      showFeedback({ message: "Availability added", type: "success" })
    })
    .catch((error) => console.error(error))
  }

  const editAvailability = (event) => {
    setIsLoading(true)
    setShowingAvailabilityForm({ visible: false })
    setDoc(doc(db, "availability", event.id), event)
    .then(() => {
      setAvailability(availability.map(e =>  e.id === event.id ? event : e))
      setIsLoading(false)
      showFeedback({ message: "Availability saved", type: "success" })
    })
  }

  const addSession = (event) => {
    setIsLoading(true)
    setShowingEventForm({ visible: false })
    setDoc(doc(db, "sessions", event.id), event)
    .then(() => {
      setBookedSessions(bookedSessions.concat([event]))
      setIsLoading(false)
      showFeedback({ message: "New session scheduled", type: "success" })
    })
  }

  const editSession = (event) => {
    setIsLoading(true)
    setShowingEventForm({ visible: false })
    setDoc(doc(db, "sessions", event.id), event)
    .then(() => {
      setBookedSessions(bookedSessions.map(e =>  e.id === event.id ? event : e))
      setIsLoading(false)
      showFeedback({ message: "Session saved", type: "success" })
    })
  }

  const deleteSession = (event) => {
    setIsLoading(true)
    setViewingEvent(null)
    deleteDoc(doc(db, "sessions", event.id))
    .then(() => {
      setBookedSessions(bookedSessions.filter(e =>  e.id !== event.id))
      setIsLoading(false)
      showFeedback({ message: "Session deleted", type: "success" })
    })
  }

  return (
    <div className="calendar">
      {isLoading && <Loader />}

      {feedback && 
      	<Feedback 
          message={feedback.message} 
          type={feedback.type} 
         />
       }

      <Navigation 
        date={date} 
        setDate={setDate}
        setShowingEventForm={setShowingEventForm} 
      />

      <DayLabels />

      <Grid
        date={date}
        bookedSessions={bookedSessions}
        availability={availability}
        specialAvailability={specialAvailability}
        setShowingEventForm={setShowingEventForm} 
        setShowingAvailabilityForm={setShowingAvailabilityForm}
        setViewingEvent={setViewingEvent} 
        actualDate={date}
        user={user}
      />

      {viewingEvent && 
        <Event 
          event={viewingEvent} 
          setShowingEventForm={setShowingEventForm}
          setViewingEvent={setViewingEvent} 
          deleteEvent={deleteSession} 
          availability={availability}
          specialAvailability={specialAvailability}
          bookedSessions={bookedSessions}
          admin={user.admin}
        />
      }

      {showingEventForm && showingEventForm.visible &&
        <EventForm 
          withEvent={showingEventForm.withEvent}
          preselectedDate={showingEventForm.preselectedDate}
          prebookedSessions={showingEventForm.prebookedSessions}
          setShowingEventForm={setShowingEventForm} 
          addEvent={addSession}
          editEvent={editSession}
          setViewingEvent={setViewingEvent}
          user={user}
          dateAvailability={showingEventForm.dateAvailability}
          availability={availability}
          users={users}
        />
      }

      {showingAvailabilityForm && showingAvailabilityForm.visible &&
        <AvailabilityForm
          withEvent={showingAvailabilityForm.withEvent}
          preselectedDate={showingAvailabilityForm.preselectedDate}
          prebookedSessions={showingAvailabilityForm.prebookedSessions}
          setShowingAvailabilityForm={setShowingAvailabilityForm} 
          addAvailability={addAvailability}
          editAvailability={editAvailability}
          addSpecialAvailability={addSpecialAvailability}
          editSpecialAvailability={editSpecialAvailability}
        />
      }   

    </div>
  )
}

export default Calendar;