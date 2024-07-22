console.log("JavaScript Running");


document.addEventListener("DOMContentLoaded", function() {
    const alertContainer = document.getElementById("alert-container");
    const okButton = document.getElementById("ok-button");
    const mainContent = document.getElementById("main-content");

    alertContainer.style.visibility = 'visible';
    alertContainer.style.opacity = '1';

    okButton.addEventListener("click", function() {
        alertContainer.style.opacity = '0';
        alertContainer.style.visibility = 'hidden';

        setTimeout(() => {
            mainContent.classList.add('show-content');
        }, 500);
    });
});






let playingCurrentSong = new Audio();
let songs = [];
let songsFolderHandle;
let currentSongIndex = -1;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getDirectoryHandle() {
    songsFolderHandle = await window.showDirectoryPicker();
    displayPlaylist();
}

async function getSongs(folderHandle) {
    songs = [];
    for await (const entry of folderHandle.values()) {
        if (entry.kind === 'file' && entry.name.endsWith('.mp3')) {
            songs.push(entry);
        }
    }

    let songUList = document.querySelector(".songsList ul");
    songUList.innerHTML = "";
    for (const song of songs) {
        songUList.innerHTML += `<li>
            <img src="svgs/music.svg" alt="music">
            <div class="details">
                <div>${song.name}</div>
                <div>${folderHandle.name}</div>
            </div>
            <div class="playCircle">
                <span>Play</span>
                <img src="svgs/playCircle.svg" alt="playCircle">
            </div>
        </li>`;
    }

    Array.from(document.querySelector(".songsList ul").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", element => {
            playSong(songs.find(song => song.name === e.querySelector(".details div").innerHTML));
        });
    });

    displaySearchSongs(songs);
}

function displaySearchSongs(songs) {
    let songUList = document.querySelector(".songsList ul");
    songUList.innerHTML = "";
    for (const song of songs) {
        songUList.innerHTML += `<li>
            <img src="svgs/music.svg" alt="music">
            <div class="details">
                <div class="animated-text">${song.name}</div>
                <div>${songsFolderHandle.name}</div>
            </div>
            <div class="playCircle">
                <span>Play</span>
                <img src="svgs/playCircle.svg" alt="playCircle">
            </div>
        </li>`;
    }

    Array.from(document.querySelector(".songsList ul").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", element => {
            playSong(songs.find(song => song.name === e.querySelector(".details div").innerHTML));
        });
    });
}

const playSong = async (songFileHandle, pause = false) => {
    try {
        const file = await songFileHandle.getFile();
        const songURL = URL.createObjectURL(file);

       
        playingCurrentSong.pause();
        playingCurrentSong.src = '';

        playingCurrentSong.src = songURL;
        
        if (!pause) {
            playingCurrentSong.play().then(() => {
                play.src = "svgs/pause.svg";
            }).catch(() => {
                console.log("Error playing song:");
            });
        } else {
            play.src = "svgs/play.svg";
        }
        
        document.querySelector(".songDetail").innerHTML = songFileHandle.name;
        document.querySelector(".songTime").innerHTML = "00:00 / 00:00";

        currentSongIndex = songs.findIndex(song => song.name === songFileHandle.name);
    } catch (error) {
        console.log("Error playing song:");
    }
}




document.querySelector(".iconSearch input").addEventListener("input", e => {
    const searchInput = e.target.value.toLowerCase();
    const exactMatches = songs.filter(song => song.name.toLowerCase() === searchInput);
    const partialMatches = songs.filter(song => song.name.toLowerCase().includes(searchInput) && song.name.toLowerCase() !== searchInput);

    const filteredSongs = [...exactMatches, ...partialMatches];

    if (filteredSongs.length > 0) {
        displaySearchSongs(filteredSongs);
    }
});

async function displayPlaylist() {
    console.log("Playlist Loading...");

    let playlistContainer = document.querySelector(".playlistContainer");
    playlistContainer.innerHTML = "";


    let firstPlaylistHandle = null;

    for await (const entry of songsFolderHandle.values()) {
        if (entry.kind === 'directory') {
            const folderHandle = entry;
            if (!firstPlaylistHandle) firstPlaylistHandle = folderHandle;

            let title = folderHandle.name;
            let description = "An eclectic mix of classics, energetic beats, chill, and smooth beats.";
            let coverImage = "default.jpg";

            try {
                const infoFileHandle = await folderHandle.getFileHandle('info.json', { create: false });
                const file = await infoFileHandle.getFile();
                const text = await file.text();
                const info = JSON.parse(text);
                title = info.title || title;
                description = info.description || description;
            } catch (error) {

                console.log("Error fetching metadata")
            }

            try {
                const coverImageHandle = await folderHandle.getFileHandle('cover.jpg', { create: false });
                coverImage = URL.createObjectURL(await coverImageHandle.getFile());
            } catch (error) {
    
                console.log("Error fetching cover image")
            }

            playlistContainer.innerHTML +=
                `<div data-folder="${folderHandle.name}" class="playlistCard">
                    <div class="playB" id="playB">
                        <img src="svgs/playB.svg" alt="playB">
                    </div>
                    <img class="cardImage" src="${coverImage}" alt="playlist">
                    <h2 class="cardHeading">${title}</h2>
                    <p class="cardDetail">${description}</p>
                </div>`;
        }
    }

    Array.from(document.getElementsByClassName("playlistCard")).forEach(card => {
        card.addEventListener("click", async () => {
            let folderHandle = await songsFolderHandle.getDirectoryHandle(card.dataset.folder);
            await getSongs(folderHandle);

            if (songs.length === 0) {
                alert("No songs in playlist.");
            } else {
                playSong(songs[0]);
            }
        });
    });

    if (firstPlaylistHandle) {
        await getSongs(firstPlaylistHandle);
        if (songs.length > 0) {
            playSong(songs[0], true);
        }
    }
}

async function main() {
    
    await getDirectoryHandle();

    // Start with the first song if available
    
    if (songs.length > 0) {
        await playSong(songs[0], true); 
    }

    // Play and Pause
    play.addEventListener("click", () => {
        if (playingCurrentSong.paused) {
            playingCurrentSong.play();
            play.src = "svgs/pause.svg";
        } else {
            playingCurrentSong.pause();
            play.src = "svgs/play.svg";
        }
    });


    document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        event.preventDefault(); 
        if (playingCurrentSong.paused) {
            playingCurrentSong.play().then(() => {
                play.src = "svgs/pause.svg";
            }).catch(error => {
                console.error("Error playing song:", error);
            });
        } else {
            playingCurrentSong.pause();
            play.src = "svgs/play.svg";
        }
    }
});

    // Duration of playing song
    playingCurrentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songTime").innerHTML =
            `${secondsToMinutesSeconds(playingCurrentSong.currentTime)} / ${secondsToMinutesSeconds(playingCurrentSong.duration)}`;
        document.querySelector(".point").style.left = (playingCurrentSong.currentTime / playingCurrentSong.duration) * 100 + "%";
    });

    // Seekbar movement
    document.querySelector(".seekbar").addEventListener("click", e => {
        let seekposition = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".point").style.left = seekposition + "%";
        playingCurrentSong.currentTime = ((playingCurrentSong.duration) * seekposition) / 100;
    });

    // Previous and Next

    previous.addEventListener("click", () => {
        playingCurrentSong.pause();
        if (currentSongIndex > 0) {
            playSong(songs[currentSongIndex - 1]);
        } else if (songs.length > 0) {
            playSong(songs[songs.length - 1]);
        }
    });

    next.addEventListener("click", () => {
        playingCurrentSong.pause();
        if (currentSongIndex < songs.length - 1) {
            playSong(songs[currentSongIndex + 1]);
        } else if (songs.length > 0) {
            playSong(songs[0]);
        }
    });

  


    // Automatically play next song when current song ends
    playingCurrentSong.addEventListener("ended", () => {
        if (currentSongIndex < songs.length - 1) {
            playSong(songs[currentSongIndex + 1]);
        } else if (songs.length > 0) {
            playSong(songs[0]);
        }
    });


    // Volume and Mute
    document.querySelector(".volumeRange").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        playingCurrentSong.volume = parseInt(e.target.value) / 100;
        if (playingCurrentSong.volume > 0) {
            document.querySelector(".volume>img").src = document.querySelector(".volume>img").src.replace("svgs/mute.svg", "svgs/volume.svg")
        }
        else{
            document.querySelector(".volume>img").src = document.querySelector(".volume>img").src.replace("svgs/volume.svg", "svgs/mute.svg")
        }
    })

    document.querySelector(".volume>img").addEventListener("click", e => {
        if (e.target.src.includes("svgs/volume.svg")) {
            e.target.src = e.target.src.replace("svgs/volume.svg", "svgs/mute.svg")
            playingCurrentSong.volume = 0;
            document.querySelector(".volumeRange").getElementsByTagName("input")[0].value = 0;
        }
        else {
            e.target.src = e.target.src.replace("svgs/mute.svg", "svgs/volume.svg")
            playingCurrentSong.volume = .10;
            document.querySelector(".volumeRange").getElementsByTagName("input")[0].value = 25;
        }

    })

   
}


// Automatically request background playback permission
if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', () => playingCurrentSong.play());
    navigator.mediaSession.setActionHandler('pause', () => playingCurrentSong.pause());
}

document.getElementById("selectDirectory").addEventListener("click", async () => {
    await getDirectoryHandle();
    await main();
});







 // Hamburger Menu

 document.querySelector(".hamMenu").addEventListener("click", () => {
    console.log("Ham Clicked");
    document.querySelector(".left-part").style.left = "0";
})


document.querySelector(".closeMenu").addEventListener("click",()=>{
document.querySelector(".left-part").style.left="-110%";
})



// For Top signUp and Login page for welcome message


document.addEventListener('DOMContentLoaded', () => {
    const openModalBtn1 = document.getElementById('openModalBtn1');
    const modal = document.getElementById('modal');
    const closeModal = document.getElementsByClassName('close')[0];
    const submitBtn = document.getElementById('submitBtn');
    const greeting = document.getElementById('greeting');
    const welcomeMessage = document.getElementById('welcomeMessage');

    openModalBtn1.addEventListener('click', () => {
        modal.style.display = 'flex';
       
    });

    

    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
        
    });

    submitBtn.addEventListener('click', () => {
        const nameInput = document.getElementById('nameInput').value;
        if (nameInput) {
            welcomeMessage.textContent = `Welcome, ${nameInput}!`;
            greeting.classList.remove('hidden');
            greeting.classList.remove('hidden');
            openModalBtn1.style.display = 'none';
            modal.style.display = 'none';
           
        } else {
            alert('Please enter a name.');
        }
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
           
        }
    });
});











