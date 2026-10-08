import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import Chart from 'chart.js/auto';
import { UserDashboardService } from 'src/app/services/user-dashboard.service';
import { constants } from 'src/constants';
import { AnalyticsService } from 'src/app/services/analytics.service';

@Component({
    selector: 'app-chart',
    templateUrl: './chart.component.html',
    styleUrls: ['./chart.component.scss'],
    standalone: false
})
export class ChartComponent implements OnInit {
  public chart: any;
  @Input() filterDate: any = [];

  labels: string[] = ['Initiated', 'Pending', 'Signed', 'Expired'];
  labelEstamp: string[] = ['Initiated', 'Pending', 'Completed', 'Expired'];
  bgColor = constants.bgColor;

  stampData: number[];
  signData: number[];
  animation: any = { animateRotate: true, animateScale: true, duration: 2000, easing: 'easeOutQuart' };
  ctx: any;
  getStampData: any = [];
  getEsignData: any = [];
  backgroundColorStamp: string | string[];
  backgroundColorSign: string | string[];
  public esignChart: any; // Separate variable for Esign chart
  public estampChart: any; // Separate variable for Estamp chart
  esignTotalCount: any;
  estampTotalcount: any;
  orderDetailsData: any;

  constructor(private router: Router, private userDashboardService: UserDashboardService,private analyticsService: AnalyticsService) {
  }

  ngOnInit(): void {

  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['filterDate'].currentValue) {
      const startDate = changes["filterDate"].currentValue["startDate"]
      const endDate = changes["filterDate"].currentValue["endDate"]
      const state = changes["filterDate"].currentValue["state"]
      const branch = changes["filterDate"].currentValue["branch"]
      this.orderDetailsData = changes["filterDate"].currentValue["orderData"]

      // if (state) {
      //   const param = '?start_date=' + startDate + '&end_date=' + endDate + '&state_code=' + state.state_code;
      //   this.callApis(param)
      // } else {
      //   const param = '?start_date=' + startDate + '&end_date=' + endDate;
      //   this.callApis(param);
      // }
   this.callApis();


    }
  }

  callApis() {
    //Estamps Count API call
    //    this.userDashboardService.getFilterEstampDetails(param).subscribe(res => {
    //  this.userDashboardService.getOrdersCountForDashboard(param).subscribe((res: any) => {

    this.getStampData = this.orderDetailsData.estamp;
    this.estampTotalcount = this.getStampData.total_order;
    this.stampData = [this.getStampData.initiated_orders,
    this.getStampData.in_progress_orders,
    this.getStampData.completed_orders,
    this.getStampData.cancel_orders,
    ];        //   this.signData = this.stampData = [20,30,40,50];

    const isDataZero_1 = this.stampData.every(value => value === 0);
    this.backgroundColorStamp = isDataZero_1 ? '#612E86' : this.bgColor;
    this.createEstampChart();
    //   })

    //Esigns Count API Call
    //    this.userDashboardService.getFilterEsignDetails(param).subscribe(res => {

    this.getEsignData = this.orderDetailsData.esign;
    this.esignTotalCount = this.getEsignData.total_order;
    this.signData = [this.getEsignData.initiated_orders,
    this.getEsignData.in_progress_orders,
    this.getEsignData.completed_orders,
    this.getEsignData.cancel_orders,
    ];
    //   this.signData = this.stampData = [20,30,40,50];

    const isDataZero = this.signData.every(value => value === 0);
    this.backgroundColorSign = isDataZero ? '#612E86' : this.bgColor;
    this.createEsignChart();
    //    })
  }

  createEsignChart() {
    if (this.esignChart) {
      this.esignChart.destroy();
    }
    const chartComponent = this;
    const screenHeight = window.innerHeight;
    const cutoutPercentage = screenHeight <= 600 ? 33 : 30;
    this.esignChart = new Chart("Esign", {
      type: 'doughnut',

      data: {
        labels: this.labels,

        datasets: [{
          data: this.signData,
          backgroundColor: this.backgroundColorSign,
          hoverOffset: 4,
          borderWidth: 0,
          borderAlign: 'inner'
        }],
      },
      options: {

        onClick: function (event, elements) {

          if (elements.length > 0) {
            var position = elements[0].index;

            let type = '';

            if (position === 0) {
              type = 'Initiated';
            } else if (position === 1) {
              type = 'Pending';
            } else if (position === 2) {
              type = 'Signed';
            } else if (position === 3) {
              type = 'Expired'
            }

            chartComponent.gotoOrders(type, 'CAT_UPLOAD');


          }
        },
        aspectRatio: 3,
        maintainAspectRatio: false,
        responsive: true,
        cutout: cutoutPercentage,

        plugins: {

          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (context) {

                var value = context.raw || "";
                return value + " Orders";
              }
            }
          }
        },
        animation: {
          animateRotate: true, animateScale: true, duration: 2000, easing: 'easeOutQuart',
          onComplete: function (animation) {
            var width = animation.chart.width;
            var height = animation.chart.height;
            var ctx = animation.chart.ctx;


            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#151515";

            var selectedData0 = Number(animation.chart.data.datasets[0].data[0]);
            var selectedData1 = Number(animation.chart.data.datasets[0].data[1]);
            var selectedData2 = Number(animation.chart.data.datasets[0].data[2]);
            var selectedData3 = Number(animation.chart.data.datasets[0].data[3]);
            var selectedData = selectedData0 + selectedData1 + selectedData2 + selectedData3;
            if (selectedData === 0) {
              ctx.font = "12px Poppins";
            } else {
              ctx.font = "8px Poppins";
            }

            var line1 = chartComponent.esignTotalCount.toString();
            var line2 = "Total Orders";
            var textX = Math.round(width / 2);
            var textY = Math.round(height / 2);

            ctx.fillText(line2, textX, textY - 10);
            ctx.fillText(line1, textX, textY + 10);
          }
        }
      }

    });
  }


  createEstampChart() {

    if (this.estampChart) {
      this.estampChart.destroy();
    }

    const chartComponent = this;
    const screenHeight = window.innerHeight;
    const cutoutPercentage = screenHeight <= 600 ? 33 : 30;
    this.estampChart = new Chart("Estamp", {
      type: 'doughnut',
      data: {
        labels: this.labels,
        datasets: [{
          label: "Data", data: this.stampData,
          backgroundColor: this.backgroundColorStamp,
          hoverOffset: 4,
          borderWidth: 0,
          // borderRadius: [1,10,1,10],
          borderAlign: 'inner'
        }]
      },
      options: {

        onClick: function (event, elements) {

          if (elements.length > 0) {
            const position = elements[0].index;

            let type = '';

            if (position === 0) {
              type = 'Initiated';
            } else if (position === 1) {
              type = 'Pending';
            } else if (position === 2) {
              type = 'Signed';
            } else if (position === 3) {
              type = 'Expired'
            }

            chartComponent.gotoOrders(type, "ESTAMP");
          }
        },
        aspectRatio: 3,
        maintainAspectRatio: false,
        responsive: true,
        cutout: cutoutPercentage,

        plugins: {

          legend: { display: false },
          tooltip: {
            yAlign: "bottom",
            callbacks: {
              label: function (context) {
                var value = context.raw || "";
                return value + " Orders";
              }
            }
          }
        },
        animation: {
          animateRotate: true, animateScale: true, duration: 2000, easing: 'easeOutQuart',
          onComplete: function (animation) {
            var width = animation.chart.width;
            var height = animation.chart.height;
            var ctx = animation.chart.ctx;

            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#151515";

            var selectedData0 = Number(animation.chart.data.datasets[0].data[0]);
            var selectedData1 = Number(animation.chart.data.datasets[0].data[1]);
            var selectedData2 = Number(animation.chart.data.datasets[0].data[2]);
            var selectedData3 = Number(animation.chart.data.datasets[0].data[3]);
            var selectedData = selectedData0 + selectedData1 + selectedData2 + selectedData3;
            if (selectedData === 0) {
              ctx.font = "12px Poppins";
            } else {
              ctx.font = "8px Poppins";
            }
            var line1 = chartComponent.estampTotalcount.toString();
            var line2 = "Total Orders";
            var textX = Math.round(width / 2);
            var textY = Math.round(height / 2);

            ctx.fillText(line2, textX, textY - 10);
            ctx.fillText(line1, textX, textY + 10);
          }
        }
      }

    });
  }

  gotoOrders(label: string, type: string) {

    var status = []

    switch (label) {
      case 'Initiated':
        status = ['INITIATED'];
        break;
      case 'Pending':
        status = ['IN_PROGRESS', 'WAITING_FOR_STAMP', 'INITIATED', 'WAITING_FOR_PAYMENT'];
        break;
      case 'Signed':
        status = ['COMPLETED'];
        break;
      case 'Expired':
        status = ['CANCELLED'];
        break;
      case 'Completed':
        status = ['COMPLETED'];
        break;

    }

    const eventName = type === 'ESTAMP' ? 'click_estamp_count_status' : 'click_esign_count_status';

    this.analyticsService.trackEvent(eventName, { 
      status_label: label, 
      service_type: type 
    });
  
    this.router.navigate(['/doqfy/orders/orders-list'], {
      queryParams: {
        orderStatus: status,
        serviceType: type,
      }
    });
  }




}              