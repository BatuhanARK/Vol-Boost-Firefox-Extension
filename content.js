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

        try{
            const source = audioContext.createMediaElementSource(media);
            source.connect(gainNode);
            media.dataset.boosted = "true";
            console.log("Boost applied to media element:", media);
        }catch(e){
            console.log("Audio already connected or unsupported", e);
        }
    });
}

const observer = new MutationObserver(()=>{
    initAudio();
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

});

browser.storage.local.get("gain").then(res => {
    const g = res.gain || 1;
    initAudio();
    gainNode.gain.value = g;
});

window.addEventListener("load", () => {
    initAudio();
});