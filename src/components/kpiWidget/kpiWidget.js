// Copyright (c) Microsoft. All rights reserved.

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { refreshAllChartData } from '../../actions/kpiActions';
import PieChartGraph from './pieChartGraph';
import BarChart from './barChart';
import { Grid, Row, Col } from 'react-bootstrap';
import Select from 'react-select';
import Config from '../../common/config';
import Lang from '../../common/lang';
import DashboardPanel from '../dashboardPanel/dashboardPanel';
import { getNonFunctionalProps } from '../../common/utils';
import _ from 'lodash';

import './kpiWidget.css';

class KpiWidget extends Component {
  constructor() {
    super();
    this.state = {
      selectedValue: 'D'
    };
    this.options = [
      {
        value: 'D',
        label: Lang.KPI.LASTDAY
      },
      {
        value: 'W',
        label: Lang.KPI.LASTWEEK
      },
      {
        value: 'M',
        label: Lang.KPI.LASTMONTH
      }
    ];
  }

  shouldComponentUpdate(nextProps, nextState) {
    let nonFunctionalNextProps = _.omit(getNonFunctionalProps(nextProps), [
      'chartDataFetchComplete'
    ]);
    let nonFunctionalThisProps = _.omit(getNonFunctionalProps(this.props), [
      'chartDataFetchComplete'
    ]);
    let result =
      !_.isEqual(nonFunctionalNextProps, nonFunctionalThisProps) ||
      !_.isEqual(this.state, nextState);
    return result;
  }

  scheduleAutoUpdate() {
    this.intervalId = setTimeout(() => {
      this.props.intervalChanged(this.state.selectedValue);
    }, Config.msTelemetryApiRefreshInterval * 1000);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.chartDataFetchComplete) {
      this.scheduleAutoUpdate();
    }
  }

  componentWillUnmount() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  componentWillUpdate(nextProps) {
    if (nextProps.devices) {
      this.props.intervalChanged(this.state.selectedValue);
    }
  }

  updateValue(newValue) {
    this.setState({
      selectedValue: newValue
    });
    this.props.intervalChanged(newValue);
  }
  render() {
    return (
        <DashboardPanel
            className="kpi-widget"
            title={Lang.KPI.SYSTEMKPI}
            actions={
                <Select
                        className="kpi-filters"
                        autofocus
                        options={this.options}
                        value={this.state.selectedValue}
                        onChange={this.updateValue.bind(this)}
                        simpleValue
                        searchable={false}
                        clearable={false}
                        placeholder="{Lang.KPI.TIMERANGE}"
                    />
            }>
          <Grid fluid className="kpiWidget">
            <div className="kpi-container">
              <Row>
                  <Col md={12} className="top-rules">
                      {Lang.KPI.TOPRULESTRIGGERED}
                  </Col>
              </Row>
              <Row>
                  <Col md={12}>
                      <BarChart timeCode={this.state.selectedValue} />
                  </Col>
              </Row>
              <Row className="kpiRow">
                  <Col md={12}>
                      <PieChartGraph />
                  </Col>
              </Row>
            </div>
          </Grid>
        </DashboardPanel>
    );
  }
}

const mapDispatchToProps = dispatch => ({
  intervalChanged: timeCode => {
    let firstDurationFrom, secondDurationFrom, secondDurationTo;
    switch (timeCode) {
      case 'D':
        secondDurationTo = firstDurationFrom = 'NOW-P1D';
        secondDurationFrom = 'NOW-P2D';
        break;

      case 'W':
        secondDurationTo = firstDurationFrom = 'NOW-P1W';
        secondDurationFrom = 'NOW-P2W';
        break;

      case 'M':
        secondDurationTo = firstDurationFrom = 'NOW-P1M';
        secondDurationFrom = 'NOW-P2M';
        break;

      default:
        return null;
    }

    dispatch(
      refreshAllChartData(
        firstDurationFrom,
        'NOW',
        secondDurationFrom,
        secondDurationTo
      )
    );
  }
});

const mapStateToProps = state => ({
  devices: state.deviceReducer.devices,
  chartDataFetchComplete: state.kpiReducer.chartDataFetchComplete
});

export default connect(mapStateToProps, mapDispatchToProps)(KpiWidget);
