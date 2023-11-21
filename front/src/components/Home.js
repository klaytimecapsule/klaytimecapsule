import { Link } from "react-router-dom";
import background from '../video/background.mp4';
import background2 from '../video/background2.mp4';

function Home() {
    return (
        <div className="home">
            <video className='background_video' muted autoPlay loop src={background2} alt='background' />
            <div className='background_mock' />
            <div className='title_box'>
                <span className='title'>Klay Time Capsule</span>
                <span className='semi_title'>
                    Easiest way to keep assets safe.
                </span>
                <span className='semi_title'>
                    Don't worry about losing your wallet.
                </span>
                <div className='title_button_box'>
                    <Link to='/app'>
                        <button className='title_button'>
                            Start app
                        </button>
                    </Link>
                    <button className='title_button' onClick={() => window.open('https://klay-time-capsule.gitbook.io/ktc/')}>
                        Documentation
                    </button>
                </div>
            </div>
        </div>
    )
}


export default Home;