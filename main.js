import {ToyReact,Component} from './ToyReact'

class MyCpmponent extends Component{
    render(){
        return <div>
            <span>hello</span>
            <span>world!</span>
            <div>
                {true}
                {this.children}
            </div>
        </div>
    }

    
}

let a = <MyCpmponent id="level1" name="level1">
    <div>
        <span>text</span>
    </div>
</MyCpmponent>

ToyReact.render(a,document.body)