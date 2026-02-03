import { style } from '@vanilla-extract/css';

export const VersionInfoStyle = {
    container : style({
        marginTop: 'auto',
        marginRight: '3px'
    }),
    icon: style({
        marginLeft: '0.8em',
        width: '21px',
        height: '21px',
        background: 'url("/src/assets/icons/help_over.png") no-repeat',
        // ロールオーバー時のチラつき防止
        backgroundSize: '21px',
        display: 'inline-block',
        ':hover' : {
            background: 'url("/src/assets/icons/help_over.png") no-repeat',
            width: '21px',
            height: '21px',
            backgroundSize: '21px'
        }
    })
}