/**
 * shuffles given array non-destructively
 * @template T
 * @param {T[]} param0 array to shuffle; not to be mutated
 * @returns {T[]} shuffled array
 */
const shuffle = ([...array]) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

class Color {
    /**
     * converts number to 2-digit hex. if number is less than 0 or greater than 255, uses mod 256
     * @param {number} n number to convert to hex
     * @returns {string} 2-digit hex
     */
    static paddedHex(n) {
        return (n % 0x100).toString(16).padStart(2, "0");
    }

    /**
     * creates new color from the hex code; if hex is not valid, returns null
     * @param {`#${string}`} hex hex color code starting with #
     * @returns {Color?}
     */
    static fromHex(hex) {
        const match = hex.match(/#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
        if (!match) return null;

        return new Color(
            parseInt(match[1], 16),
            parseInt(match[2], 16),
            parseInt(match[3], 16)
        );
    }

    /**
     * @param {number} r red component
     * @param {number} g green component
     * @param {number} b blue component
     */
    constructor(r, g, b) {
        this.r = r % 0x100;
        this.g = g % 0x100;
        this.b = b % 0x100;
    }

    /**
     * returns hex color code string; invoked with template literal
     * @returns {string} hex color code
     */
    toString() {
        return `#${Color.paddedHex(this.r)}${Color.paddedHex(
            this.g
        )}${Color.paddedHex(this.b)}`;
    }

    /**
     * compares this and other color for equality
     * @param {Color?} other color to compare to
     * @returns {boolean} true if colors are equal
     */
    eq(other) {
        return (
            !!other &&
            this.r === other.r &&
            this.g === other.g &&
            this.b === other.b
        );
    }

    /**
     * compares this and other color and calculates distance between them
     * (-1 if other color is null)
     * @param {Color?} other
     * @returns {number} squared distance between this and other color
     */
    diff(other) {
        return other
            ? Math.pow(this.r - other.r, 2) +
                  Math.pow(this.g - other.g, 2) +
                  Math.pow(this.b - other.b, 2)
            : -1;
    }

    /**
     * creates new color with given difference from this color
     * @param {number} r difference in red component
     * @param {number} g difference in green component
     * @param {number} b difference in blue component
     * @param {number} [multiplier=1] multiplier for each component
     * @returns {Color} new color
     */
    cloneWithDiff(r, g, b, multiplier = 1) {
        return new Color(
            this.r - r * multiplier,
            this.g - g * multiplier,
            this.b - b * multiplier
        );
    }
}

class Game {
    /**
     * creates new game
     * @param {number} num number of whites
     * @param {number} difficulty difficulty of the game; 1 is hard, 3 is easy
     */
    constructor(num, difficulty) {
        /**
         * score in the game
         * @type {number}
         */
        this.score = difficulty == 1 ? 1000 : 100;

        /**
         * try counts in the game
         * @type {number}
         */
        this.tryCount = 0;

        /**
         * the time the game started; null if not started yet
         * @type {Date?}
         */
        this.startTime = null;

        /**
         * @type {number}
         */
        this.colorStep = difficulty;

        const white = new Color(255, 255, 255);

        /** @type {Color[]} */
        const colors = [];
        for (let r = 0; r <= 5; ++r) {
            for (let g = 0; g <= 5; ++g) {
                for (let b = 0; b <= 5; ++b) {
                    colors.push(white.cloneWithDiff(r, g, b, difficulty));
                }
            }
        }

        /**
         * color list of this game
         * @type {Color[]}
         */
        this.colors = shuffle(colors).slice(0, num);

        /**
         * the color to be guessed
         * @type {Color}
         */
        this.answer =
            this.colors[Math.floor(Math.random() * this.colors.length)];
    }

    start() {
        this.startTime = new Date();
        View.removeStartButton();
        View.hideSuccess();
        View.showPalette(this);
        View.showTarget({ color: this.answer });
        View.updateScore(this);
        View.updateTimer({ startTime: this.startTime });
    }

    /**
     * handles user's try
     * @param {`#${string}`} hex color code starting with #
     * @returns {boolean | null} true if success
     */
    onTry(hex) {
        if (this.startTime === null) return null;
        const color = Color.fromHex(hex);
        if (!color) return null;

        ++this.tryCount;

        const isSuccess = this.answer.eq(color);
        if (isSuccess) {
            this.onSuccess();
        } else {
            this.onFailure(color);
        }

        return isSuccess;
    }

    /**
     * handles user's try when success
     * @this {Game & { startTime: Date }}
     */
    onSuccess() {
        const elapsed = new Date().getTime() - this.startTime.getTime();
        View.updateScore(this);

        const [commentShared, commentShown] =
            this.colorStep !== 1
                ? ["| チュートリアルを完了しました！", "チュートリアル終了！"]
                : this.tryCount === 1
                ? ["| 一発で白を見つけられました！", "一発で白を見つけられた！"]
                : elapsed <= 10000
                ? ["| 素早く白を見つけられました！", "素早く白を見つけられた！"]
                : ["", ""];

        View.showSuccess({
            ...this,
            elapsed,
            commentShared,
            commentShown,
        });
    }

    /**
     * handles user's try when failure
     * @this {Game & { startTime: Date }}
     * @param {Color} color the selected color
     */
    onFailure(color) {
        const diff = color.diff(this.answer) / this.colorStep ** 2;
        this.score -= diff;

        View.updateScore(this);
        View.showFailure({ color: color.toString(), diff });
    }
}

/**
 * the game. if null, game is not started
 * @type {Game?}
 */
let game = null;

var View = {
    /**
     * removes start button
     */
    removeStartButton() {
        const startButtonElement = document.getElementById("start_btn");
        if (startButtonElement != null) startButtonElement.remove();
    },

    /**
     * shows color palette
     * @param {object} props
     * @param {Color[]} props.colors
     */
    showPalette(props) {
        const alt = /** @type {HTMLDivElement} */ (
            document.getElementById("list")
        );
        alt.innerHTML = props.colors
            .map(
                (c) =>
                    `<div class="alternatives" id="col_${c
                        .toString()
                        .slice(
                            1
                        )}" onclick="submit('${c}')" style="background-color: ${c}"></div>`
            )
            .join("\n");
    },

    /**
     * shows the target color
     * @param {object} props
     * @param {Color} props.color
     */
    showTarget(props) {
        const textElement = /** @type {HTMLParagraphElement} */ (
            document.getElementById("problem_text")
        );
        textElement.innerHTML = `この白を探せ！<br>${props.color}`;

        const colorBoxElement = /** @type {HTMLDivElement} */ (
            document.getElementById("problem_color_box")
        );
        colorBoxElement.style.setProperty(
            "background-color",
            props.color.toString()
        );
    },

    /**
     * hides success modal
     */
    hideSuccess() {
        const modalElement = /** @type {HTMLDivElement} */ (
            document.getElementById("modal_ac")
        );
        modalElement.style.visibility = "hidden";
    },

    /**
     * reflects score state to the UI
     * @param {object} props
     * @param {number} props.score the score
     * @param {number} props.tryCount the try count
     */
    updateScore(props) {
        const tryEl = /** @type {HTMLParagraphElement} */ (
            document.getElementById("try")
        );
        tryEl.innerText = `Try: ${props.tryCount}`;

        const scoreEl = /** @type {HTMLParagraphElement} */ (
            document.getElementById("score")
        );
        scoreEl.innerText = `Score: ${props.score.toFixed(2)}`;
    },

    /**
     * updates the timer and returns elapsed time
     * @param {object} props
     * @param {Date} props.startTime elapsed time in milliseconds
     */
    updateTimer(props) {
        const elapsed = new Date().getTime() - props.startTime.getTime();
        const timeElement = /** @type {HTMLParagraphElement} */ (
            document.getElementById("time")
        );
        timeElement.innerHTML = `Time<br> ${(elapsed / 1000).toFixed(2)}`;
        setTimeout(() => {
            View.updateTimer(props);
        }, 30);
    },

    /**
     * shows failure modal
     * @param {object} props
     * @param {string} props.color the selected color in hex
     * @param {number} props.diff the difference between the selected color and the answer
     */
    showFailure(props) {
        const modalElement = /** @type {HTMLDivElement} */ (
            document.getElementById("modal_hazure")
        );
        modalElement.classList.add("hazure_anim");
        modalElement.addEventListener("animationend", () => {
            modalElement.classList.remove("hazure_anim");
        });
        const textElement = /** @type {HTMLParagraphElement} */ (
            document.getElementById("hazure_text")
        );
        textElement.innerHTML = `${
            props.color
        }<br>はずれ (-${props.diff.toFixed(2)})`;
    },

    /**
     * shows success modal
     * @param {object} props
     * @param {number} props.score the score
     * @param {number} props.elapsed elapsed time in milliseconds
     * @param {number} props.tryCount the try count
     * @param {string} props.commentShown comment to be shown
     * @param {string} props.commentShared comment to be shared
     */
    showSuccess(props) {
        const modalElement = /** @type {HTMLDivElement} */ (
            document.getElementById("modal_ac")
        );
        modalElement.style.visibility = "visible";

        const scoresElement = /** @type {HTMLDivElement} */ (
            document.getElementById("ac_scores")
        );
        scoresElement.innerHTML = `\
Score: ${props.score}<br>
Time: ${(props.elapsed / 1000).toFixed(3)}<br>
Try: ${props.tryCount}<br>`;

        const commentElement = /** @type {HTMLParagraphElement} */ (
            document.getElementById("ac_comment")
        );
        commentElement.innerText = props.commentShown;

        const shareElement = /** @type {HTMLAnchorElement} */ (
            document.getElementById("tw_share")
        );
        shareElement.setAttribute(
            "href",
            `http://twitter.com/share?url=${encodeURI(
                location.href
            )}&hashtags=white_200&related=TumoiYorozu&text=${encodeURI(
                `200色の白から見つけよう！ White 200 ${
                    props.commentShared
                }\n得点:${props.score} 時間:${props.elapsed.toFixed(
                    3
                )}秒 クリック回数:${props.tryCount}`
            )}`
        );
    },
};

/**
 * submit and tries to guess the color
 * @param {`#${string}`} hex hex color code starting with #
 */
function submit(hex) {
    if (!game) return;
    switch (game.onTry(hex)) {
        case true:
            game = null;
            return;
        case false:
            return;
        case null:
            start(200, 3);
            return;
    }
}

/**
 * starts the game
 * @param {number} num number of whites
 * @param {num} dif initial state.colorStep
 */
function start(num, dif) {
    game = new Game(num, dif);
    game.start();
}
