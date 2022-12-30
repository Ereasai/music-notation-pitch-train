
/* VexFlow */
const { Renderer, Stave, StaveNote, Voice, Formatter, Accidental, Beam } = Vex.Flow;

/* CONSTANTS */
const STAVE_LENGTH      = 80;
const STAVE_XOFFSET     = 10;
const STAVE_BASS_XSTART = 80;
const MIDDLE_C_ABS      = 39;

/* REFERENCES */
let btnAction = null;
let stage     = null;
let piano     = null;
let pianoKeys = [];

/* CONTROL */
let notesToDisplay = [];
let gameState = 'start';
let problem_answer = null;
let problem_answer_num = null;

document.addEventListener('DOMContentLoaded', init);

/**
 * Initializes the page.
 * When all of DOM elements are loaded, get references, set events, etc.
 */
function init() {
    btnAction = document.getElementById('btn-action');
    stage     = document.getElementById('stage');
    piano     = document.getElementById('piano');

    btnAction.addEventListener('click', () => {
        actionButtonBehavior[gameState]();
    });

    createPiano();
}

/**
 * Defines the behavior of the action button.
 */
const actionButtonBehavior = {
    start: () => {
        /* Set problem for the page */
        // TODO: customization should be possible. Right now, the notes that
        //       will be selected are only the ones without ledger lines.
        const MAJOR_PATTERN = "wwwhwwh";
        let patternIndex = 0;

        for (let i = 20; i <= 58; i++) {
            notesToDisplay.push(i);
            if (MAJOR_PATTERN[patternIndex % MAJOR_PATTERN.length] == 'w') i++;
            patternIndex++;
        }

        let prevProblem = problem_answer_num; // save this reference for piano.

        // get the stage ready.
        removePianoFancyAnimation();
        stage.classList.remove('flex-center');

        // check the function `answer` to see the behavior from here.
        actionButtonBehavior.answer();
    }, 

    /**
     * When action button is pressed, the following things happen:
     * 1. the answer to the current problem is revealed. 
     * 2. the corresponding piano key is selected.
     * 3. button inner text updated.
     * 4. finally, the state changes to `answer`.
     */
    question: () => {
        revealAnswer();
        gameState = 'answer';
        btnAction.innerText = "Next Question"
        selectKey(problem_answer_num);
    },

    /**
     * When action button is pressed, the following things happen:
     * 1. if it exists, the piano key is deselected.
     * 2. the stage is cleared.
     * 3. new question is loaded.
     * 4. button now displays `"Show Answer"`
     * 5. finally, the state changes to `question`.
     */
    answer: () => {
        deselectKey(problem_answer_num);
        clearStage();
        loadQuestion();
        gameState = 'question'
        btnAction.innerText = "Show Answer";
    }
}

/**
 * Picks the next note and generates the SVG of the notation. The `stage` 
 * container and the `problem_answer` and `problem_answer_num` variable is 
 * updated.
 */
function loadQuestion() {
    /* Pick random notes to show */
    let randomIndex = Math.floor(Math.random() * notesToDisplay.length);
    let randomNote  = notesToDisplay[randomIndex];
    let problem     = convertNoteName(randomNote);

    problem_answer     = problem; // save answer for other contexts.
    problem_answer_num = randomNote;

    // determine which stave to display this problem on.
    let clefToDisplay = (randomNote < MIDDLE_C_ABS) ? 'bass' : 'treble';

    /* Render notation */
    let output = document.createElement('div');
    output.classList.add('fade-in');
    stage.appendChild(output);

    const renderer = new Renderer(output, Renderer.Backends.SVG);
    renderer.resize(100, 200);
    
    const context = renderer.getContext();

    // create stave and draw.
    const staveTreble = new Stave( STAVE_XOFFSET, 
                                   0,  
                                   STAVE_LENGTH, 
                                   {fill_style: 'black'} );
    staveTreble.addClef("treble");
    staveTreble.setContext(context).draw();
    
    const staveBass = new Stave( STAVE_XOFFSET, 
                                 STAVE_BASS_XSTART, 
                                 STAVE_LENGTH, 
                                 {fill_style: 'black'} );
    staveBass.addClef("bass");
    staveBass.setContext(context).draw();

    // create StaveNote with our problem.
    const notes = [
        new StaveNote({ keys: [problem],  
                        duration: "1", 
                        clef: clefToDisplay, 
                        stem: 'down' })
    ];

    // create Voice.
    const voice = new Voice({ num_beats: 1, beat_value: 1 });
    voice.addTickables(notes);
    new Formatter().joinVoices([voice]).format([voice], STAVE_LENGTH);

    // draw voice (notes).
    voice.draw(context, (clefToDisplay == 'treble') ? staveTreble : staveBass);

}

/**
 * Reveals the answer to the current problem. Specifically, a span with text is
 * created with `id=answer-lettername` in the stage. Also updates the piano.
 */
function revealAnswer() {
    /* Create span with answer */
    let ans = document.createElement('span');
    ans.innerHTML = problem_answer;
    ans.id = 'answer-lettername';
    ans.classList.add('fade-in');
    stage.appendChild(ans);
}


function createPiano() {
    /*
        w - white key
        b - regular black key
        A - left shifted black key
        B - right shifted black key
    */
    let pattern = 'wAwBwwAwbwBw'; // defines pattern starting from C.

    // first black key need not be shifted, create it manually.
    createKey(['white']); // A/0
    createKey(['black']); // A#/0
    createKey(['white']); // B/0
    // start from C.
    for (let i = 3; i < 88; i++) {
        let patternIndex = (i-3) % 12;
        let currPattern = pattern[patternIndex];
        switch (currPattern) {
            case 'w' : createKey(['white']); break;
            case 'b' : createKey(['black']); break;
            case 'A' : createKey(['black', 'type-a']); break;
            case 'B' : createKey(['black', 'type-b']); break;
        }
    }

    applyPianoFancyAnimation();
}

function applyPianoFancyAnimation() {
    let delay = 0;
    let deltaDelay = 10;
    let index = 0;
    pianoKeys.forEach(key => {
        key.classList.add(`key-${index}`);
        key.innerHTML =
        `
        <style>
            .key-${index} {
                animation: key-intro-animation 300ms ease 1 ${delay}ms;
            }
            @keyframes key-intro-animation {
                0% {
                    background-color: red;
                    transform: translateY(20px);
                }
                100% {
                    transform: translateY(0px);
                }
            }
        </style>
        `;
        delay += deltaDelay;
        index++;
    });
}

function removePianoFancyAnimation() {
    pianoKeys.forEach(key => {
       key.innerHTML = '';
    });
}

/**
 * Given list of classes of a key, a key is added to the `piano` and the 
 * `pianoKeys` reference. 
 * @param {list} classes 
 */
function createKey(classes) {
    let key = document.createElement('div');
    classes.forEach(element => {
        key.classList.add(element);
    });
    key.classList.add('key');
    piano.appendChild(key);
    pianoKeys.push(key); 
}

/**
 * The given key index is deselected on the `piano` element.
 * @param {number} prevProblem 
 */
function deselectKey(keyIndex) {
    // if previous problem exists, clear that key on the piano.
    if (keyIndex != null) {
        pianoKeys[keyIndex].classList.remove('selected');
    }
}


function selectKey(keyIndex) {
    if (keyIndex != null) {
        pianoKeys[keyIndex].classList.add('selected');
    }
}




/* UTILITIES */
/**
 * Clears the div with `id="stage"`.
 */
function clearStage() {
    while (stage.firstChild) {
        stage.removeChild(stage.firstChild);
    }
}

/**
 * Given a number btween 0-87, the index of piano key, the function converts it to `note/octave`
 * form and returns it. If the note is a white key, a string is returned. If the note is a black
 * key, a list is returned, containing the `[flat, sharp]` representation of the note.
 * @param {number} absNote 
 * @returns `note/octave` string. If it is a black key, return the 
 */
function convertNoteName(absNote) {
    /* Check for errors */
    // type error
    if (typeof(absNote) != 'number') {
        throw new TypeError("Note value must be a number between 0-87.");
    }
    // out of range
    if (absNote < 0 || absNote > 87) {
        throw new Error("Note value is out of bounds, i.e. doesn't exist on the piano.");
    }

    /* Find the note representation */
    // a white key note is just single character.
    // a black key note is a list, containing the two accidentals.
    const NOTE_ALPHABET = 
        [ 
            'A', 
            ['Bb', 'A#'], 
            'B', 
            'C', 
            ['Db', 'C#'], 
            'D', 
            ['Eb', 'D#'], 
            'E', 
            'F', 
            ['Gb', 'F#'], 
            'G',
            ['Ab', 'G#']
        ];

    let   note   = NOTE_ALPHABET[absNote % 12];
    const octave = Math.floor( (absNote+9) / 12);

    /* Format the output and return */
    // black note: return two representation.
    if (typeof(note) == 'object') {
        return [`${note[0]}/${octave}`,
                `${note[1]}/${octave}`];
    }

    // white note: return one representation.
    return `${note}/${octave}`;
}