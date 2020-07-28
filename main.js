import { ToyReact, Component } from './src/ToyReact'

class Square extends Component {
    constructor(props) {
        super(props);
        this.state = {
            value: null,
        };
    }

    handleClick() {
        if (this.state.value) {
            this.setState({ value: null })
        } else {
            this.setState({ value: 'X' })
        }
    }

    render() {
        return (
            <button
                className="square"
                onClick={() => this.handleClick()}
            >
                {this.state.value || ""}
            </button>
        );
    }
}

class Board extends Component {
    renderSquare(i) {
        return <Square value={i} />
    }

    render() {
        return (
            <div>
                <div className="board-row">
                    {this.renderSquare(0)}
                    {this.renderSquare(1)}
                    {this.renderSquare(2)}
                </div>
                <div className="board-row">
                    {this.renderSquare(3)}
                    {this.renderSquare(4)}
                    {this.renderSquare(5)}
                </div>
                <div className="board-row">
                    {this.renderSquare(6)}
                    {this.renderSquare(7)}
                    {this.renderSquare(8)}
                </div>
            </div>
        );
    }
}


ToyReact.render(<Board />, document.body)