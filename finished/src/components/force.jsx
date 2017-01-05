import React                from 'react';
import ReactDOM from 'react-dom';
import {connect}            from 'react-redux';
import * as actionCreators  from '../lib/action-creators';
import * as d3 from 'd3';
import {forceSimulation, forceManyBody, forceLink, forceCenter, forceCollide, forceX} from 'd3-force';

const styles = {
  width   : 960,
  height  : 480,
  padding : 30,
};

const radius = 10;

var fill = d3.scale.category20c();
const simulation = forceSimulation();

// *****************************************************
// ** d3 functions to manipulate attributes
// *****************************************************

var enterNode = (selection) => {
  selection.classed('node', true);

  selection.append('circle')
    .attr("r", (d) => radius)
    .style("stroke", (d) => d3.rgb(fill(d.id)).darker())
    .style("fill", (d) => fill(d.id))

    // .call(simulation.drag);

  selection.append('text')
    .attr("x", (d) => radius + 3)
    .attr("dy", ".35em")
    .text((d) => d.index);
};

var updateNode = (selection) => {
  const padding = radius*3;
  selection
    .attr("cx", (d) => (d.x = Math.max(padding, Math.min(styles.width - padding, d.x)) ))
    .attr("cy", (d) => (d.y = Math.max(padding, Math.min(styles.height - padding, d.y)) ))
    .attr("transform", (d) => `translate(${d.x}, ${d.y})`);
};

var enterLink = (selection) => {
  selection.classed('link', true)
    .attr("stroke-width", (d) => 2);
};

var updateLink = (selection) => {
  selection.attr("x1", (d) => d.source.x)
    .attr("y1", (d) => d.source.y)
    .attr("x2", (d) => d.target.x)
    .attr("y2", (d) => d.target.y);
};

var updateGraph = (selection) => {
  selection.selectAll('.node')
    .call(updateNode);
  selection.selectAll('.link')
    .call(updateLink);
};

// *****************************************************
// ** Graph and App components
// *****************************************************

class Force extends React.Component {
  simSetup(props) {
    if (this.ready) {
      console.log('already ready')
      return;
    }
    this.d3Graph = d3.select(ReactDOM.findDOMNode(this.refs.graph));
    
    const nodes = props.nodes.slice();
    const links = props.links.slice();

    var d3Nodes = this.d3Graph.selectAll('.node')
      .data(nodes, (node) => node.key);
    d3Nodes.enter().append('g').call(enterNode);
    d3Nodes.exit().remove();
    d3Nodes.call(updateNode);

    var d3Links = this.d3Graph.selectAll('.link')
      .data(links, (link) => link.key);
    d3Links.enter().insert('line', '.node').call(enterLink);
    d3Links.exit().remove();
    d3Links.call(updateLink);

    simulation.velocityDecay(0.9);
    simulation.nodes(nodes);

    const linkForce = forceLink(props.links.slice())
      .id(d => d.index)
      // .strength(d => 1 / 100)
      // .distance(d => 100)

    simulation.force("link", linkForce);
    // simulation.force("charge", forceManyBody());
    simulation.force("center", forceCenter(styles.width/2, styles.height/2));
    simulation.force("collision", forceCollide(50));
    
    this.ready = true;
  }

  componentDidMount() {
    console.log(' cdm ');

    this.simSetup(this.props);

    simulation.on('tick', () => {
      // after force calculation starts, call updateGraph
      // which uses d3 to manipulate the attributes,
      // and React doesn't have to go through lifecycle on each tick
      this.d3Graph.call(updateGraph);

    });
  }

  shouldComponentUpdate(nextProps) {
    console.log(' should ', nextProps);
    this.simSetup(nextProps);
    return false;
  }

  render() {  
    return <div>
      <h1>Force Directed Graph</h1>

      <svg width={styles.width} height={styles.height} style={{border:'2px solid black'}}> 
        <g ref='graph' />
      </svg>
      
      <div className="controls">
        <button className="btn randomize" onClick={() => this.props.randomizeData()}>
          Randomize Data
        </button>
      </div>
    </div>
  }

};

export default connect((state) => state, actionCreators)(Force);

