function init() {
    d3.queue()
        .defer(d3.csv, "data/nodes.csv")
        .defer(d3.csv, "data/links.csv")
        .await(setData);
}

function setData(error, nodes, links) {
    if (error)
        throw error;

    //Give each node an initial weight. To be changed upon creating links for ease of filtering link-less nodes
    nodes.forEach(function (d) {
        d.weight = 0;
    });

    drawNet(nodes, links);
}

function drawNet(nodes, links) {
    //Remove any existing SVG
    d3.select("svg").remove();

    var svg_location = "#net";
    var width = 800;
    var height = 800;

    var fill = d3.scaleOrdinal(d3.schemeCategory10);

    //Create SVG
    var svg = d3.select(svg_location).append("svg")
        .attr("width", width)
        .attr("height", height);

    //Force layout settings
    var simulation = d3.forceSimulation(nodes)
        .force("charge", d3.forceManyBody().strength(-100))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("x", d3.forceX(width))
        .force("y", d3.forceY(height))
        .force("link", d3.forceLink().links(links).distance(100));

    // build a dictionary of nodes that are linked
    var linkedByIndex = {};
    links.forEach(function (d) {
        linkedByIndex[d.source.index + "," + d.target.index] = 1;
    });

    // check the dictionary to see if nodes are linked
    function isConnected(a, b) {
        return linkedByIndex[a.index + "," + b.index] || linkedByIndex[b.index + "," + a.index] || a.index == b.index;
    }

    simulation.on("tick", ticked);

    function updateLinks() {
        var link = svg
            .selectAll("line")
            .data(links);

        //Add weight to nodes with links for node filter
        link.enter()
            .append("line")
            .attr("class", function (d) {
                return (d.source.id + " " + d.target.id);
            })
            .merge(link)
            .attr("x1", function (d) {
                d.source.weight = 1;
                return d.source.x;
            })
            .attr("y1", function (d) {
                return d.source.y;
            })
            .attr("x2", function (d) {
                d.target.weight = 1;
                return d.target.x;
            })
            .attr("y2", function (d) {
                return d.target.y;
            });

        link.exit().remove()
    }

    function updateNodes() {
        //Filter nodes by weight
        var node = svg
            .selectAll("text")
            .data(nodes.filter(function (d) {
                return d.weight == 1;
            }));

        node.enter()
            .append("text")
            .text(function (d) {
                return d.id;
            })
            .merge(node)
            .attr("x", function (d) {
                return d.x;
            })
            .attr("y", function (d) {
                return d.y;
            })
            .attr("dy", function (d) {
                return 5;
            })
            .style("fill", function (d, i) {
                return fill(i);
            })
            .on("click", function (d) {
                var allNodes = d3.selectAll("text");

                //Style for selected node
                allNodes
                    .style("opacity", function (o) {
                        return isConnected(d, o) ? 1 : 0.5;
                    })
                    .style("font-size", function (o) {
                        return isConnected(d, o) ? "18px" : "16px";
                    })
                    .style("font-weight", function (o) {
                        return isConnected(d, o) ? "bold" : "none";
                    })
                    .style("text-shadow", function (o) {
                        return isConnected(d, o) ? "-2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff, 2px 2px 0 #fff" : "none";
                    });

                //Fade/reset non-selected links
                d3.selectAll("line")
                    .style("stroke", "#ccc")
                    .style("stroke-width", "1px");

                //Highlight selected links
                d3.selectAll("." + d.id)
                    .style("stroke", "#333")
                    .style("stroke-width", "2px");
            });

        node.exit().remove()
    }

    function ticked() {
        updateLinks();
        updateNodes();
    }
}