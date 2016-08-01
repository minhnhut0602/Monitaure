import React from 'react';

class UserInfoComponent extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        if (typeof this.props.user.userEmailMD5 === 'undefined') {
            return null;
        }

        const gravatarURL = `https://gravatar.com/avatar/${this.props.user.userEmailMD5}?size=100`;

        return (
            <div className="profile">
                <a href="http://gravatar.com" target="_blank" rel="noopener" title="Set or change your profile picture">
                    <img src={gravatarURL} alt="Profile picture" />
                </a>
                <span>{this.props.user.userName}</span>
            </div>
        );
    }
}

export default UserInfoComponent;