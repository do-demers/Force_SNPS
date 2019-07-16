
function init() {
    d3.queue()
        .defer(d3.csv, "data/nodes105.csv")
        .defer(d3.csv, "data/links105.csv")
        .defer(d3.csv, "data/nodes110.csv")
        .defer(d3.csv, "data/links110.csv")
        .await(setData);
}

function setData(error, nodes105, links105, nodes110, links110) {
    if (error)
        throw error;

    //Give each node an initial weight. To be changed upon creating links for ease of filtering link-less nodes
    nodes105.forEach(function (d) {
        d.weight = 0;
    });

    nodes110.forEach(function (d) {
        d.weight = 0;
    });

    drawNet(nodes105, links105);

    d3.select("#q105").on("click", function () {
        d3.select("svg").transition()
            .delay(function (d, i) {
                return i * 10;
            })
            .duration(500)
            .style('opacity', 0)
            .on('end', drawNet(nodes105, links105));
    });

    d3.select("#q110b").on("click", function () {
        d3.select("svg").transition()
            .delay(function(d,i) { return i * 10; })
            .duration(500)
            .style('opacity', 0)
            .on('end', drawNet(nodes110, links110));
    });
}

function drawNet(nodes, links) {

    //remove old SVG
    d3.select("svg").remove();

    //SVG for forcelayout
    var svg_location = "#net";
    var width = 1100;
    var height = 650;

    //Create SVG
    var svg = d3.select(svg_location).append("svg")
        .attr("width", width)
        .attr("height", height)
        .style('opacity', 0);


    var fill = d3.scaleOrdinal(d3.schemeCategory10);

    svg.transition()
        .delay(function(d,i) { return i * 10; })
        .duration(1000)
        .style('opacity', 1);

    //Force layout settings
    var simulation = d3.forceSimulation(nodes)
        .force("charge", d3.forceManyBody().strength(-850))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide(30))
        .force("x", d3.forceX(width / 2).strength(0.75))
        .force("y", d3.forceY(height / 2).strength(0.75))
        .force("link", d3.forceLink().links(links).distance(5));

    // build a dictionary of nodes that are linked
    var linkedByIndex = {};
    links.forEach(function (d) {
        linkedByIndex[d.source.index + "," + d.target.index] = 1;
    });

    // check the dictionary to see if nodes are linked
    function isConnected(a, b) {
        return linkedByIndex[a.index + "," + b.index] || linkedByIndex[b.index + "," + a.index] || a.index == b.index;
    }

    prepTable(nodes,links);

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
                return d.x = Math.max(50,Math.min(width - 50, d.x));
            })
            .attr("y", function (d) {
                return d.y = Math.max(10, Math.min(height - 10, d.y));
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

function prepTable (nodes,links){
    //Add table for accessibility
    var tableData = [];
    var i;

    //Get source, target, freq of nodes and links
    for (i = 0; i<links.length;i++){
        tableData[i] = new Object();
        tableData[i].source = links[i].source.id;
        tableData[i].target = links[i].target.id;
        tableData[i].freq = links[i].freq;

    }
    makeTable(tableData);
}

function makeTable(data){
    var commafmt = d3.format(",d");

    //Remove existing table
    $('#wordTable').DataTable().destroy();
    d3.selectAll("table").remove();

    //Create table
    var columns = ["source", "target", "freq"];
    var headers = ["Source word", "Target word", "Frequency"];

    var table = d3.select("#table")
        .append("table")
        .attr("id","wordTable")
        .attr("class", "table table-striped table-hover");

    var thead = table.append('thead');

    var tbody = table.append('tbody');

    thead.append('tr')
        .attr("class", "active")
        .selectAll('th')
        .data(headers)
        .enter()
        .append('th')
        .text(function (column) {
            return column;
        });

    var rows_grp = tbody
        .selectAll('tr')
        .data(data);

    var rows_grp_enter = rows_grp
        .enter()
        .append('tr')
    ;

    rows_grp_enter.merge(rows_grp);

    rows_grp_enter.selectAll('td')
        .data(function (row) {
            return columns.map(function (column) {
                return {
                    column: column,
                    value: isNaN(row[column])? row[column] : commafmt(row[column])
                };
            });
        })
        .enter()
        .append('td')
        .html(function (d) {
                return d.value;
            }
        )
    ;


    $('#wordTable').DataTable( {
        paging: true,
        "order": [[ 2, "desc" ]]
    } );

}

//Add SVG transition fade upon changing data/question choice