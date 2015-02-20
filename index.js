var STATE_CHANGES = {
        MOUNT: 'mount',
        UPDATE: 'update'
    };

module.exports = {
    TICK: 20,
    UPDATE_RENDER_LOG_POSITION_TIMEOUT_MS: 500,
    MAX_LOG_LENGTH: 20,

    renderLogContainer: null,
    renderLogDetail: null,
    renderLogRenderCount: null,
    _updateRenderLogPositionTimeout: null,

    componentDidMount: function(){
        // Reset the logs
        this._resetRenderLog();

        // Record initial mount
        this.addToRenderLog(this.state, 'Initial Render');

        // Build the monitor node
        this._buildRenderLogNode();

        // Highlight the initial mount
        this._highlightChange(STATE_CHANGES.MOUNT);

        // Set the watch to update log position
        this._updateRenderLogPositionTimeout = setInterval(this._updateRenderLogPosition, this.UPDATE_RENDER_LOG_POSITION_TIMEOUT_MS);
    },

    componentDidUpdate: function(prevProps, prevState){
        // Get the changes in state and props
        this._getReasonForReRender(prevProps, prevState);

        // Update the render log
        this._updateRenderLogNode();

        // Highlight the update
        this._highlightChange(STATE_CHANGES.UPDATE);
    },

    componentWillUnmount: function (){
        // Remove the monitor node
        this._removeRenderLogNode();

        // Clear the update position timeout
        clearInterval(this._updateRenderLogPositionTimeout);
    },

    /* 
     * Reset the logs
     * @return void
     */
    _resetRenderLog: function(){
        this.state.renderLog = [];
        this.state.renderCount = 1;
    },

    /*
     * Build the renderLog node, add it to the body and assign it's position based on the monitored component
     * @return void
     */
    _buildRenderLogNode: function(){
        var self = this,
            renderLogContainer = document.createElement('div'),
            renderLogRenderCountNode = document.createElement("div"),
            renderLogDetailNode = document.createElement("div");

        renderLogContainer.className = 'renderLog';
        renderLogContainer.addEventListener('click', function(){
            self.renderLogContainer.classList.toggle('show');
        });

        renderLogRenderCountNode.className = 'renderLogCounter';
        renderLogRenderCountNode.innerText = 1;

        renderLogDetailNode.className = 'renderLogDetail';
        renderLogDetailNode.innerText = '';

        renderLogContainer.appendChild(renderLogRenderCountNode);
        renderLogContainer.appendChild(renderLogDetailNode);

        this.renderLogContainer = renderLogContainer;
        this.renderLogDetail = renderLogDetailNode;
        this.renderLogRenderCount = renderLogRenderCountNode;

        // Append to the body
        document.getElementsByTagName('body')[0].appendChild(renderLogContainer);

        // Set initial position
        this._updateRenderLogPosition();
    },

    /*
     * Update the render log position based on its parent position
     * @return void
     */
    _updateRenderLogPosition: function(){
        var parentNode = this.getDOMNode(),
            parentNodeRect = parentNode && parentNode.getBoundingClientRect();

        if (this.renderLogContainer) {
            this.renderLogContainer.style.top = (window.pageYOffset + parentNodeRect.top) + 'px';
            this.renderLogContainer.style.left = parentNodeRect.left + 'px';
        }
    },

    /*
     * Update the render log count and details
     * @return void
     */
    _updateRenderLogNode: function() {
        var logFragment = document.createDocumentFragment();

        if (this.renderLogRenderCount) {
            this.renderLogRenderCount.innerText = (this.state.renderCount - 1 );
        }

        if (this.renderLogDetail) {
            this.renderLogDetail.innerHTML = '';
            for(var i = 0; i < this.state.renderLog.length; i++){
                var item = document.createElement('div');
                item.innerText = this.state.renderLog[i];
                logFragment.appendChild(item);
            }

            this.renderLogDetail.appendChild(logFragment);
        }
        //this.state.renderCount++;
    },

    /*
     * Remove the render log node from the body
     * @return void
     */
    _removeRenderLogNode: function() {
        if (this.renderLogContainer) {
            document.getElementsByTagName('body')[0].removeChild(this.renderLogContainer);
        }
    },

    /*
     * Add a detail message to the render log and update the count
     * @param object nextState - The most current state of the component
     * @param String message
     * @return void
     */
    addToRenderLog: function(state, message){
        state.renderLog.unshift(state.renderCount + ') ' + message);
        state.renderCount++;

        // Trim the log
        state.renderLog.splice(this.MAX_LOG_LENGTH, 1);
    },


    /*
     * Get the changes made to props or state.  In the event this component has its own shouldComponentUpdate, don't do
     * anything
     * @param object prevProps
     * @param object prevState
     * @return boolean
     */
    _getReasonForReRender: function(prevProps, prevState){
        var nextState = this.state,
            nextProps = this.props,
            key;

        if (this.shouldComponentUpdate) return false;

        for (key in nextState){
            if (nextState.hasOwnProperty(key) && nextState[key] !== prevState[key]){
                if (typeof nextState[key] === 'object')
                    return this.addToRenderLog(this.state, 'this.state['+key+'] changed');
                else
                    return this.addToRenderLog(this.state, 'this.state['+key+'] changed from ' + prevState[key] + ' => ' + nextState[key]);
            }
        }

        for (key in nextProps) {
            if (nextProps.hasOwnProperty(key) && nextProps[key] !== prevProps[key]) {
                if (typeof nextProps[key] === 'object')
                    return this.addToRenderLog(this.state, 'this.props['+key+'] changed');
                else
                    return this.addToRenderLog(this.state, 'this.props['+key+'] changed from ' + prevProps[key] + ' => ' + nextProps[key]);
            }
        }

        return this.addToRenderLog(this.state, 'force update called in ' + this.constructor.displayName);
    },

    /*
     * Highlight any change by adding an animation style to the component DOM node
     * @param String change - The type of change being made to the node
     * @return void
     */
    _highlightChange: function(change) {
        var parentNode = this.getDOMNode();

        if (parentNode) {
            parentNode.classList.remove('highlight', 'highlight-update','highlight-mount');

            setTimeout(function() {
                parentNode.classList.add('highlight', 'highlight-' + change);
            }, this.TICK);
        }
    }
};
