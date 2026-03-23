let audioContext;
let gainNode;
let compressor;

function initAudio(){
    if(!audioContext){
        audioContext = new AudioContext();

        gainNode = audioContext.createGain();
        compressor = audioContext.createDynamicsCompressor();

        compressor.threshold.value = -10;
        compressor.knee.value = 10;
        compressor.ratio.value = 20;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.25;

        gainNode.connect(compressor);
        compressor.connect(audioContext.destination);

        console.log("AudioContext ve gainNode oluşturuldu");
    }

    if(audioContext.state === "suspended"){
        audioContext.resume();
        console.log("AudioContext resumed");
    }

    const mediaElements = document.querySelectorAll("video,audio");

    mediaElements.forEach(media=>{
        if(media.dataset.boosted) return;
        
        const wasPlaying = !media.paused;
        const currentTime = media.currentTime;
        
        try{
            const source = audioContext.createMediaElementSource(media);
            source.connect(gainNode);
            media.dataset.boosted = "true";

            if(wasPlaying){
                media.currentTime = currentTime;
                media.play().catch(() => {});
            }
            console.log("Boost applied to media element:", media);
        }catch(e){
            console.log("Audio already connected or unsupported", e);
        }
    });
}

let initTimeout;
const observer = new MutationObserver(()=>{
    clearTimeout(initTimeout);
    initTimeout = setTimeout(() => {
        initAudio();
    }, 500);
});

observer.observe(document.body,{
    childList:true,
    subtree:true
});

browser.runtime.onMessage.addListener(msg => {
    if(msg.type === "SET_GAIN"){
        initAudio();
        gainNode.gain.value = msg.gain;
    }
    if(msg.type === "REFRESH"){
        observer.disconnect();
        
        document.querySelectorAll("[data-boosted]").forEach(el => {
            delete el.dataset.boosted;
        });
        
        initAudio();
        gainNode.gain.value = gainNode.gain.value;
        console.log("REFRESH complete, boosted elements:", document.querySelectorAll("[data-boosted]").length);
        observer.observe(document.body, { childList: true, subtree: true });
    }
});

browser.storage.local.get("gain").then(res => {
    const g = res.gain || 1;
    initAudio();
    gainNode.gain.value = g;
});

window.addEventListener("load", () => {
    initAudio();
});