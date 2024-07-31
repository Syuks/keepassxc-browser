'use strict';

(async () => {
    await initColorTheme();

    $('#lock-database-button').show();

    const tab = await getCurrentTab();
    if (!tab) {
        return [];
    }

    const logins = await getLoginData();
    const ll = document.getElementById('login-list');
    let index = -1;

    for (const [ i, login ] of logins.entries()) {
        const uuid = login.uuid;
        const a = document.createElement('a');
        a.textContent = login.text;
        a.setAttribute('class', 'list-group-item');
        a.setAttribute('id', '' + i);

        a.addEventListener('click', (e) => {
            if (!e.isTrusted) {
                return;
            }

            const id = e.target.id;
            browser.tabs.sendMessage(tab?.id, {
                action: 'fill_user_pass_with_specific_login',
                id: Number(id),
                uuid: uuid
            });

            close();
        });

        a.addEventListener('mousemove', (e) => {
            if (e.movementX === 0 && e.movementY === 0) {
                return;
            }
            deselectItem();
    
            const itemContainer = e.target.classList.contains('list-group-item') ? e.target : e.target.parentElement;
            itemContainer.classList.add('list-group-item--active');
    
            const items = getAllItems();
            index = Array.from(items).indexOf(itemContainer);
        });

        ll.appendChild(a);
    }

    if (logins.length > 1) {
        $('#filter-block').show();
        const filter = document.getElementById('login-filter');
        
        filter.addEventListener('keyup', (e) => {
            if (!e.isTrusted || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                return;
            }

            const val = filter.value;
            const re = new RegExp(val, 'i');
            const links = ll.getElementsByTagName('a');
            for (const i in links) {
                if (links.hasOwnProperty(i)) {
                    const found = String(links[i].textContent).match(re) !== null;
                    links[i].style = found ? '' : 'display: none;';
                }
            }

            index = 0;
            selectItem();
        });

        filter.addEventListener('keydown', (e) => {
            if (!e.isTrusted) {
                return;
            }

            cancelEvent(e);
            
            if (e.key === 'ArrowDown') {
                const items = getAllItems();
                index = (index + 1) % items.length;
                selectItem();
                return;
            }
            
            if (e.key === 'ArrowUp') {
                const items = getAllItems();
                index = (index > 0 ? index : items.length) - 1;  
                selectItem();
                return;
            }
            
            if (e.key === 'Enter') {
                const selectedItem = getAllItems()[index];

                if (!selectedItem) {
                    return;
                }

                browser.tabs.sendMessage(tab?.id, {
                    action: 'fill_user_pass_with_specific_login',
                    id: Number(selectedItem.id),
                    uuid: logins[selectedItem.id].uuid
                });

                close();
                return;
            }
        });

        filter.focus();
    }

    function cancelEvent(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
    }

    function selectItem() {
        deselectItem();
        const items = getAllItems();
        const item = items[index];
        if (item !== undefined) {
            item.classList.add('list-group-item--active');
            item.scrollIntoView({ block: 'nearest' });
        }
    }

    function deselectItem() {
        const items = ll.querySelectorAll('a.list-group-item--active');
        items.forEach(item => item.classList.remove('list-group-item--active'));
    }

    function getAllItems() {
        return ll.querySelectorAll('a.list-group-item:not([style*="display: none"])');
    }

    $('#lock-database-button').addEventListener('click', (e) => {
        browser.runtime.sendMessage({
            action: 'lock_database'
        });

        $('#credentialsList').hide();
        $('#database-not-opened').show();
        $('#lock-database-button').hide();
        $('#database-error-message').textContent = tr('errorMessageDatabaseNotOpened');
    });

    $('#reopen-database-button').addEventListener('click', (e) => {
        browser.runtime.sendMessage({
            action: 'get_status',
            args: [ false, true ] // Set forcePopup to true
        });
    });

    // Initialize selection
    index = 0;
    selectItem();
})();
